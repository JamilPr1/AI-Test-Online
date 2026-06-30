'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestInterface from '@/components/TestInterface';
import { useProctor } from '@/hooks/useProctor';
import type { ClientQuestion } from '@/lib/shuffle';

interface StoredSession {
  sessionId: string;
  startedAt: string;
  examPaper: ClientQuestion[];
  candidate: { fullName: string; email: string };
}

export default function TestPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);

  const { flush, requestFullscreen, getState } = useProctor(
    session?.sessionId ?? null,
    ready
  );

  useEffect(() => {
    const raw = sessionStorage.getItem('testSession');
    if (!raw) {
      router.replace('/');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed.examPaper?.length) {
        router.replace('/');
        return;
      }
      setSession(parsed);
    } catch {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const ping = () => {
      fetch('/api/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const warnInterval = setInterval(() => {
      const s = getState();
      setProctorWarnings(
        s.tabSwitches + s.focusLosses + s.copyEvents + s.pasteEvents + s.linksOpened.length
      );
    }, 2000);
    return () => clearInterval(warnInterval);
  }, [session, getState]);

  const handleStart = async () => {
    await requestFullscreen();
    setReady(true);
  };

  const handleSubmit = useCallback(
    async (answers: Record<string, number | string | null>) => {
      if (!session || submitting) return;
      setSubmitting(true);

      try {
        const proctorState = await flush();

        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            answers,
            startedAt: session.startedAt,
            ...proctorState,
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Submit failed');

        sessionStorage.setItem('testResult', JSON.stringify(result));
        sessionStorage.removeItem('testSession');
        router.push('/complete');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
        setSubmitting(false);
      }
    },
    [session, submitting, flush, router]
  );

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading test...</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ready to Begin?</h1>
          <p className="text-slate-600 mb-2">
            Welcome, <strong>{session.candidate.fullName}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Your session is proctored. Tab switches, external links, and clipboard actions
            are logged. Please stay on this page for the entire test.
          </p>
          <button type="button" className="btn-primary w-full" onClick={handleStart}>
            Enter Fullscreen & Start Test
          </button>
          <p className="text-xs text-slate-400 mt-4">
            If fullscreen is unavailable, you may still proceed — activity will be monitored.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <TestInterface
          session={session}
          examQuestions={session.examPaper}
          onSubmit={handleSubmit}
          submitting={submitting}
          proctorWarnings={proctorWarnings}
        />
      </div>
    </div>
  );
}
