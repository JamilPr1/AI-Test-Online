import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSession } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, linkedin, yearsExperience, currentRole } = body;

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const id = uuidv4();
    const startedAt = new Date().toISOString();

    await createSession({
      id,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      linkedin: linkedin?.trim() || null,
      years_experience: yearsExperience || null,
      current_role: currentRole?.trim() || null,
      started_at: startedAt,
    });

    return NextResponse.json({ sessionId: id, startedAt });
  } catch (error) {
    console.error('Session start error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to start session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
