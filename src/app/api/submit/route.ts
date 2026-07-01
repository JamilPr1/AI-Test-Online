import { NextRequest, NextResponse } from 'next/server';
import { getSession, completeSession } from '@/lib/storage';
import {
  getDraftFromSession,
  questionCountForSession,
} from '@/lib/completeExam';
import { questions } from '@/lib/questions';

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
      const existing = session.answers_json
        ? JSON.parse(session.answers_json)
        : {};
      return NextResponse.json({
        score: session.score,
        totalPoints: session.total_points,
        percentage: session.percentage,
        passed: session.percentage >= 60,
        questionCount: questionCountForSession(session),
        integrity: session.integrity_flags_json
          ? JSON.parse(session.integrity_flags_json)
          : { level: 'low', flags: [] },
        candidateName: session.full_name,
        headshotData: session.headshot_data,
        alreadySubmitted: true,
        answers: existing.answers,
      });
    }

    const draft = getDraftFromSession(session);
    const mergedAnswers = { ...(draft?.answers ?? {}), ...answers };

    const updated = await completeSession(sessionId, mergedAnswers, {
      startedAt: startedAt || session.test_started_at || session.started_at,
      proctor: {
        tabSwitches,
        focusLosses,
        copyEvents,
        pasteEvents,
        rightClicks,
        fullscreenExits,
        behaviorLog,
        linksOpened,
      },
    });

    if (!updated || updated.status !== 'submitted') {
      console.error(`Submit persistence failed for session ${sessionId}`);
      return NextResponse.json(
        { error: 'Failed to save your submission. Please try again.' },
        { status: 500 }
      );
    }

    const integrity = updated.integrity_flags_json
      ? JSON.parse(updated.integrity_flags_json)
      : { level: 'low', flags: [] };

    return NextResponse.json({
      score: updated.score,
      totalPoints: updated.total_points,
      percentage: updated.percentage,
      passed: updated.percentage >= 60,
      questionCount: questionCountForSession(updated),
      integrity,
      candidateName: updated.full_name,
      headshotData: updated.headshot_data,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Failed to submit test.' }, { status: 500 });
  }
}
