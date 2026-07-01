import { NextRequest, NextResponse } from 'next/server';
import { listSessions, sessionForList } from '@/lib/storage';
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
  try {
    const auth = request.cookies.get(ADMIN_COOKIE)?.value;
    if (auth !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const sessions = await listSessions();

    const enriched = sessions.map((s) => {
      const integrity = s.integrity_flags_json
        ? JSON.parse(s.integrity_flags_json)
        : getIntegrityRisk({
            tab_switches: s.tab_switches,
            focus_losses: s.focus_losses,
            copy_events: s.copy_events,
            paste_events: s.paste_events,
            links_opened_json: s.links_opened_json,
            fullscreen_exits: s.fullscreen_exits,
          });
      return { ...sessionForList(s), integrity };
    });

    const stats = {
      total: sessions.filter((s) => s.status === 'submitted').length,
      submitted: sessions.filter((s) => s.status === 'submitted').length,
      inProgress: sessions.filter((s) => s.status === 'in_progress').length,
      passed: sessions.filter(
        (s) => s.status === 'submitted' && s.percentage >= 60
      ).length,
      avgScore:
        sessions.filter((s) => s.status === 'submitted').length > 0
          ? Math.round(
              sessions
                .filter((s) => s.status === 'submitted')
                .reduce((sum, s) => sum + s.percentage, 0) /
                sessions.filter((s) => s.status === 'submitted').length
            )
          : 0,
    };

    const response = NextResponse.json({
      sessions: enriched,
      stats,
      fetchedAt: new Date().toISOString(),
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Admin list error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to load sessions.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
