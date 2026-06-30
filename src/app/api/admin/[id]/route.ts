import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ADMIN_COOKIE } from '@/lib/utils';
import { questions, getIntegrityRisk, gradeCodingAnswer } from '@/lib/questions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = request.cookies.get(ADMIN_COOKIE)?.value;
  if (auth !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getDb();
  const session = db
    .prepare('SELECT * FROM test_sessions WHERE id = ?')
    .get(params.id) as Record<string, unknown> | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const answersData = session.answers_json
    ? JSON.parse(session.answers_json as string)
    : null;

  const behaviorLog = session.behavior_log_json
    ? JSON.parse(session.behavior_log_json as string)
    : [];

  const linksOpened = session.links_opened_json
    ? JSON.parse(session.links_opened_json as string)
    : [];

  const integrity = session.integrity_flags_json
    ? JSON.parse(session.integrity_flags_json as string)
    : getIntegrityRisk({
        tab_switches: session.tab_switches as number,
        focus_losses: session.focus_losses as number,
        copy_events: session.copy_events as number,
        paste_events: session.paste_events as number,
        links_opened_json: session.links_opened_json as string,
        fullscreen_exits: session.fullscreen_exits as number,
      });

  const questionReview = questions.map((q) => {
    const userAnswer = answersData?.answers?.[q.id] ?? null;

    if (q.type === 'mcq') {
      const correct = answersData?.breakdown?.[q.id] === true;
      return {
        id: q.id,
        type: q.type,
        category: q.category,
        question: q.question,
        options: q.options,
        points: q.points,
        userAnswer,
        correct,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    }

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
}
