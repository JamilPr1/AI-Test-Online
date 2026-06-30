import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ensureDb } from '@/lib/db';

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

    const db = await ensureDb();
    const id = uuidv4();
    const startedAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO test_sessions (
        id, full_name, email, phone, linkedin, years_experience, current_role,
        status, started_at, behavior_log_json, links_opened_json, integrity_flags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, '[]', '[]', '[]')`,
      args: [
        id,
        fullName.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        linkedin?.trim() || null,
        yearsExperience || null,
        currentRole?.trim() || null,
        startedAt,
      ],
    });

    return NextResponse.json({ sessionId: id, startedAt });
  } catch (error) {
    console.error('Session start error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to start session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
