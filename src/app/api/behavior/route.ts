import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  updateSession,
  type BehaviorEvent,
  type LinkOpened,
} from '@/lib/storage';

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

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const mergedBehavior: BehaviorEvent[] = [
      ...JSON.parse(session.behavior_log_json || '[]'),
      ...(behaviorLog || []),
    ];
    const mergedLinks: LinkOpened[] = [
      ...JSON.parse(session.links_opened_json || '[]'),
      ...(linksOpened || []),
    ];

    const updated = await updateSession(sessionId, {
      tab_switches: tabSwitches ?? session.tab_switches,
      focus_losses: focusLosses ?? session.focus_losses,
      copy_events: copyEvents ?? session.copy_events,
      paste_events: pasteEvents ?? session.paste_events,
      right_clicks: rightClicks ?? session.right_clicks,
      fullscreen_exits: fullscreenExits ?? session.fullscreen_exits,
      behavior_log_json: JSON.stringify(mergedBehavior),
      links_opened_json: JSON.stringify(mergedLinks),
      last_activity_at: new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Behavior tracking error:', error);
    return NextResponse.json({ error: 'Failed to record behavior.' }, { status: 500 });
  }
}
