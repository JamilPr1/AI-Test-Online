import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ADMIN_COOKIE, verifyAdminPassword } from '@/lib/utils';
import { getIntegrityRisk } from '@/lib/questions';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = request.cookies.get(ADMIN_COOKIE)?.value;
  if (auth !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getDb();
  const sessions = db
    .prepare(
      `SELECT id, full_name, email, phone, linkedin, years_experience, current_role,
        status, score, total_points, percentage, tab_switches, focus_losses,
        copy_events, paste_events, right_clicks, fullscreen_exits,
        started_at, submitted_at, time_taken_seconds, integrity_flags_json
      FROM test_sessions
      ORDER BY CASE WHEN submitted_at IS NULL THEN 1 ELSE 0 END, submitted_at DESC, started_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const enriched = sessions.map((s) => {
    const integrity = s.integrity_flags_json
      ? JSON.parse(s.integrity_flags_json as string)
      : getIntegrityRisk({
          tab_switches: s.tab_switches as number,
          focus_losses: s.focus_losses as number,
          copy_events: s.copy_events as number,
          paste_events: s.paste_events as number,
          links_opened_json: '[]',
          fullscreen_exits: s.fullscreen_exits as number,
        });
    return { ...s, integrity };
  });

  const stats = {
    total: sessions.length,
    submitted: sessions.filter((s) => s.status === 'submitted').length,
    inProgress: sessions.filter((s) => s.status === 'in_progress').length,
    passed: sessions.filter(
      (s) => s.status === 'submitted' && (s.percentage as number) >= 60
    ).length,
    avgScore:
      sessions.filter((s) => s.status === 'submitted').length > 0
        ? Math.round(
            sessions
              .filter((s) => s.status === 'submitted')
              .reduce((sum, s) => sum + (s.percentage as number), 0) /
              sessions.filter((s) => s.status === 'submitted').length
          )
        : 0,
  };

  return NextResponse.json({ sessions: enriched, stats });
}
