import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  saveDraftProgress,
  completeSession,
} from '@/lib/storage';
import {
  getDraftFromSession,
  questionCountForSession,
} from '@/lib/completeExam';
import { mcqQuestionPool, codingQuestions } from '@/lib/questions';
import { restoreExamPaper } from '@/lib/shuffle';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    let examPaper = null;
    if (session.question_shuffle_json) {
      const meta = JSON.parse(session.question_shuffle_json) as {
        shuffleMap: import('@/lib/shuffle').ShuffleMap;
        questionIds: string[];
      };
      examPaper = restoreExamPaper(
        meta.questionIds,
        meta.shuffleMap,
        mcqQuestionPool,
        codingQuestions
      );
    }

    const draft = getDraftFromSession(session);

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      testStartedAt: session.test_started_at,
      startedAt: session.started_at,
      draftAnswers: draft?.answers ?? null,
      currentIndex: draft?.currentIndex ?? 0,
      draftSavedAt: draft?.savedAt ?? null,
      examPaper,
      score: session.status === 'submitted' ? session.percentage : null,
      candidate: {
        fullName: session.full_name,
        email: session.email,
      },
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Failed to load progress.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      answers,
      currentIndex,
      finalize,
      startedAt,
      tabSwitches,
      focusLosses,
      copyEvents,
      pasteEvents,
      rightClicks,
      fullscreenExits,
      behaviorLog,
      linksOpened,
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
      return NextResponse.json({ ok: true, status: 'submitted' });
    }

    if (finalize) {
      const completed = await completeSession(sessionId, answers, {
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

      if (!completed || completed.status !== 'submitted') {
        return NextResponse.json(
          { error: 'Failed to finalize submission.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        status: 'submitted',
        score: completed.score,
        totalPoints: completed.total_points,
        percentage: completed.percentage,
        passed: completed.percentage >= 60,
        questionCount: questionCountForSession(completed),
        candidateName: completed.full_name,
        headshotData: completed.headshot_data,
      });
    }

    const updated = await saveDraftProgress(sessionId, {
      answers,
      currentIndex: currentIndex ?? 0,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      savedAt: new Date().toISOString(),
      status: updated.status,
    });
  } catch (error) {
    console.error('Progress save error:', error);
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 });
  }
}
