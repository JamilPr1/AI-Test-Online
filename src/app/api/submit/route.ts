import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '@/lib/db';
import { gradeAnswers, getIntegrityRisk, questions } from '@/lib/questions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      answers,
      tabSwitches,
      focusLosses,
      copyEvents,
      pasteEvents,
      rightClicks,
      fullscreenExits,
      behaviorLog,
      linksOpened,
      startedAt,
    } = body;

    if (!sessionId || !answers) {
      return NextResponse.json(
        { error: 'Session ID and answers are required.' },
        { status: 400 }
      );
    }

    const db = await ensureDb();
    const sessionResult = await db.execute({
      sql: 'SELECT * FROM test_sessions WHERE id = ?',
      args: [sessionId],
    });
    const session = sessionResult.rows[0] as unknown as Record<string, unknown> | undefined;

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status === 'submitted') {
      return NextResponse.json({ error: 'Test already submitted.' }, { status: 400 });
    }

    const { score, totalPoints, breakdown, codingDetails } = gradeAnswers(answers);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 1000) / 10 : 0;
    const submittedAt = new Date().toISOString();

    const startTime = startedAt
      ? new Date(startedAt).getTime()
      : new Date(session.started_at as string).getTime();
    const timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);

    const existingBehavior = JSON.parse((session.behavior_log_json as string) || '[]');
    const existingLinks = JSON.parse((session.links_opened_json as string) || '[]');
    const mergedBehavior = [...existingBehavior, ...(behaviorLog || [])];
    const mergedLinks = [...existingLinks, ...(linksOpened || [])];

    const integrityData = {
      tab_switches: tabSwitches ?? session.tab_switches,
      focus_losses: focusLosses ?? session.focus_losses,
      copy_events: copyEvents ?? session.copy_events,
      paste_events: pasteEvents ?? session.paste_events,
      links_opened_json: JSON.stringify(mergedLinks),
      fullscreen_exits: fullscreenExits ?? session.fullscreen_exits,
    };

    const integrity = getIntegrityRisk(integrityData);

    await db.execute({
      sql: `UPDATE test_sessions SET
        status = 'submitted',
        score = ?,
        total_points = ?,
        percentage = ?,
        tab_switches = ?,
        focus_losses = ?,
        copy_events = ?,
        paste_events = ?,
        right_clicks = ?,
        fullscreen_exits = ?,
        submitted_at = ?,
        time_taken_seconds = ?,
        answers_json = ?,
        behavior_log_json = ?,
        links_opened_json = ?,
        integrity_flags_json = ?
      WHERE id = ?`,
      args: [
        score,
        totalPoints,
        percentage,
        tabSwitches ?? 0,
        focusLosses ?? 0,
        copyEvents ?? 0,
        pasteEvents ?? 0,
        rightClicks ?? 0,
        fullscreenExits ?? 0,
        submittedAt,
        timeTakenSeconds,
        JSON.stringify({ answers, breakdown, codingDetails }),
        JSON.stringify(mergedBehavior),
        JSON.stringify(mergedLinks),
        JSON.stringify(integrity),
        sessionId,
      ],
    });

    return NextResponse.json({
      score,
      totalPoints,
      percentage,
      passed: percentage >= 60,
      questionCount: questions.length,
      integrity,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Failed to submit test.' }, { status: 500 });
  }
}
