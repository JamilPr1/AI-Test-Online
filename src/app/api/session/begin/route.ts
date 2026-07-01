import { NextRequest, NextResponse } from 'next/server';
import { beginTestSession } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const session = await beginTestSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (session.status === 'submitted') {
      return NextResponse.json({ error: 'Test already submitted.' }, { status: 400 });
    }

    return NextResponse.json({
      testStartedAt: session.test_started_at,
      status: session.status,
    });
  } catch (error) {
    console.error('Begin test error:', error);
    return NextResponse.json({ error: 'Failed to start test timer.' }, { status: 500 });
  }
}
