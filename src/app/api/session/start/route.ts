import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSession } from '@/lib/storage';
import { buildExamPaper } from '@/lib/shuffle';
import { mcqQuestionPool, codingQuestions, MCQ_PER_EXAM } from '@/lib/questions';
import { isValidHeadshotData } from '@/lib/image';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, headshot, yearsExperience, currentRole } = body;

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    if (!headshot || !isValidHeadshotData(headshot)) {
      return NextResponse.json(
        { error: 'A valid headshot selfie is required before starting the test.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const id = uuidv4();
    const startedAt = new Date().toISOString();
    const { examPaper, shuffleMap } = buildExamPaper(
      id,
      mcqQuestionPool,
      codingQuestions,
      MCQ_PER_EXAM
    );
    const questionIds = examPaper.map((q) => q.id);

    await createSession({
      id,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      linkedin: null,
      headshot_data: headshot,
      years_experience: yearsExperience || null,
      current_role: currentRole?.trim() || null,
      started_at: startedAt,
      last_activity_at: startedAt,
      question_shuffle_json: JSON.stringify({ shuffleMap, questionIds }),
    });

    return NextResponse.json({ sessionId: id, startedAt, examPaper });
  } catch (error) {
    console.error('Session start error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to start session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
