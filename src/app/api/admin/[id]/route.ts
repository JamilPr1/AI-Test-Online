import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/storage';
import { ADMIN_COOKIE } from '@/lib/utils';
import {
  mcqQuestionPool,
  codingQuestions,
  getIntegrityRisk,
  gradeCodingAnswer,
} from '@/lib/questions';
import type { ShuffleMap } from '@/lib/shuffle';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = request.cookies.get(ADMIN_COOKIE)?.value;
  if (auth !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const session = await getSession(params.id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status !== 'submitted') {
      return NextResponse.json({ error: 'Session not yet submitted.' }, { status: 400 });
    }

    const examMeta = session.question_shuffle_json
      ? (JSON.parse(session.question_shuffle_json) as {
          shuffleMap: ShuffleMap;
          questionIds: string[];
        })
      : null;

    const questionIds =
      examMeta?.questionIds ??
      [...mcqQuestionPool.map((q) => q.id), ...codingQuestions.map((q) => q.id)];
    const shuffleMap = examMeta?.shuffleMap ?? {};

    const answersData = session.answers_json
      ? JSON.parse(session.answers_json)
      : null;

    const behaviorLog = session.behavior_log_json
      ? JSON.parse(session.behavior_log_json)
      : [];

    const linksOpened = session.links_opened_json
      ? JSON.parse(session.links_opened_json)
      : [];

    const integrity = session.integrity_flags_json
      ? JSON.parse(session.integrity_flags_json)
      : getIntegrityRisk({
          tab_switches: session.tab_switches,
          focus_losses: session.focus_losses,
          copy_events: session.copy_events,
          paste_events: session.paste_events,
          links_opened_json: session.links_opened_json,
          fullscreen_exits: session.fullscreen_exits,
        });

    const questionReview = questionIds.map((qid) => {
      const mcq = mcqQuestionPool.find((q) => q.id === qid);
      if (mcq) {
        const shuffle = shuffleMap[qid];
        const displayOptions = shuffle
          ? shuffle.optionOrder.map((i) => mcq.options[i])
          : mcq.options;
        const correctDisplayIndex = shuffle?.correctDisplayIndex ?? mcq.correctAnswer;
        const userAnswer = answersData?.answers?.[qid] ?? null;
        const correct = answersData?.breakdown?.[qid] === true;
        return {
          id: mcq.id,
          type: mcq.type,
          category: mcq.category,
          question: mcq.question,
          options: displayOptions,
          points: mcq.points,
          userAnswer,
          correct,
          correctAnswer: correctDisplayIndex,
          explanation: mcq.explanation,
        };
      }

      const q = codingQuestions.find((c) => c.id === qid)!;
      const userAnswer = answersData?.answers?.[q.id] ?? null;
      const code = typeof userAnswer === 'string' ? userAnswer : '';
      const stored = answersData?.codingDetails?.[q.id];
      const grading = stored ?? gradeCodingAnswer(code, q);
      const earned = typeof grading.earned === 'number' ? grading.earned : 0;

      return {
        id: q.id,
        type: q.type,
        category: q.category,
        question: q.question,
        instructions: q.instructions,
        language: q.language,
        points: q.points,
        userAnswer: code,
        earned,
        correct: earned === q.points,
        criteria: q.criteria.map((c) => ({
          ...c,
          passed: grading.criteriaResults?.[c.id] ?? false,
        })),
        sampleSolution: q.sampleSolution,
      };
    });

    return NextResponse.json({
      session,
      questionReview,
      behaviorLog,
      linksOpened,
      integrity,
    });
  } catch (error) {
    console.error('Admin detail error:', error);
    return NextResponse.json({ error: 'Failed to load session.' }, { status: 500 });
  }
}
