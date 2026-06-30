import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/storage';
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

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status === 'submitted') {
      return NextResponse.json({ error: 'Test already submitted.' }, { status: 400 });
    }

    const examMeta = session.question_shuffle_json
      ? (JSON.parse(session.question_shuffle_json) as {
          shuffleMap: import('@/lib/shuffle').ShuffleMap;
          questionIds: string[];
        })
      : undefined;

    const { score, totalPoints, breakdown, codingDetails } = gradeAnswers(
      answers,
      examMeta
        ? { shuffleMap: examMeta.shuffleMap, questionIds: examMeta.questionIds }
        : undefined
    );
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 1000) / 10 : 0;
    const submittedAt = new Date().toISOString();

    const startTime = startedAt
      ? new Date(startedAt).getTime()
      : new Date(session.started_at).getTime();
    const timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);

    const existingBehavior = JSON.parse(session.behavior_log_json || '[]');
    const existingLinks = JSON.parse(session.links_opened_json || '[]');
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

    await updateSession(sessionId, {
      status: 'submitted',
      score,
      total_points: totalPoints,
      percentage,
      tab_switches: tabSwitches ?? 0,
      focus_losses: focusLosses ?? 0,
      copy_events: copyEvents ?? 0,
      paste_events: pasteEvents ?? 0,
      right_clicks: rightClicks ?? 0,
      fullscreen_exits: fullscreenExits ?? 0,
      submitted_at: submittedAt,
      time_taken_seconds: timeTakenSeconds,
      answers_json: JSON.stringify({ answers, breakdown, codingDetails }),
      behavior_log_json: JSON.stringify(mergedBehavior),
      links_opened_json: JSON.stringify(mergedLinks),
      integrity_flags_json: JSON.stringify(integrity),
    });

    return NextResponse.json({
      score,
      totalPoints,
      percentage,
      passed: percentage >= 60,
      questionCount: examMeta?.questionIds.length ?? questions.length,
      integrity,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Failed to submit test.' }, { status: 500 });
  }
}
