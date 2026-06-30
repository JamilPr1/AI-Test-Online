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
      return NextResponse.json({ error: 'Session already submitted.' }, { status: 400 });
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
      tab_switches: tabSwitches ?? 0,
      focus_losses: focusLosses ?? 0,
      copy_events: copyEvents ?? 0,
      paste_events: pasteEvents ?? 0,
      right_clicks: rightClicks ?? 0,
      fullscreen_exits: fullscreenExits ?? 0,
      behavior_log_json: JSON.stringify(mergedBehavior),
      links_opened_json: JSON.stringify(mergedLinks),
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
