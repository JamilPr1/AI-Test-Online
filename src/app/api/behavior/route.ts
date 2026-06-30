import { NextRequest, NextResponse } from 'next/server';
import { getDb, type BehaviorEvent, type LinkOpened } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      tabSwitches,
      focusLosses,
      copyEvents,
      pasteEvents,
      rightClicks,
      fullscreenExits,
      behaviorLog,
      linksOpened,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const db = getDb();
    const session = db
      .prepare('SELECT id, status FROM test_sessions WHERE id = ?')
      .get(sessionId) as { id: string; status: string } | undefined;

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session already submitted.' }, { status: 400 });
    }

    const existing = db
      .prepare(
        'SELECT behavior_log_json, links_opened_json FROM test_sessions WHERE id = ?'
      )
      .get(sessionId) as { behavior_log_json: string; links_opened_json: string };

    const mergedBehavior: BehaviorEvent[] = [
      ...JSON.parse(existing.behavior_log_json || '[]'),
      ...(behaviorLog || []),
    ];
    const mergedLinks: LinkOpened[] = [
      ...JSON.parse(existing.links_opened_json || '[]'),
      ...(linksOpened || []),
    ];

    db.prepare(
      `UPDATE test_sessions SET
        tab_switches = ?,
        focus_losses = ?,
        copy_events = ?,
        paste_events = ?,
        right_clicks = ?,
        fullscreen_exits = ?,
        behavior_log_json = ?,
        links_opened_json = ?
      WHERE id = ?`
    ).run(
      tabSwitches ?? 0,
      focusLosses ?? 0,
      copyEvents ?? 0,
      pasteEvents ?? 0,
      rightClicks ?? 0,
      fullscreenExits ?? 0,
      JSON.stringify(mergedBehavior),
      JSON.stringify(mergedLinks),
      sessionId
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Behavior tracking error:', error);
    return NextResponse.json({ error: 'Failed to record behavior.' }, { status: 500 });
  }
}
