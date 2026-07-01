'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestInterface from '@/components/TestInterface';
import PortalHeader from '@/components/PortalHeader';
import PortalLogo from '@/components/PortalLogo';
import { useProctor } from '@/hooks/useProctor';
import type { ClientQuestion } from '@/lib/shuffle';
import type { AnswerValue } from '@/lib/questions';

interface StoredSession {
  sessionId: string;
  startedAt: string;
  testStartedAt?: string;
  examPaper: ClientQuestion[];
  candidate: { fullName: string; email: string; headshot?: string };
}

type Answers = Record<string, AnswerValue>;

function draftKey(sessionId: string) {
  return `test-draft-${sessionId}`;
}

export default function TestPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Answers | undefined>();
  const [initialIndex, setInitialIndex] = useState(0);
  const [resumed, setResumed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const [loadError, setLoadError] = useState('');

  const { flush, requestFullscreen, getState } = useProctor(
    session?.sessionId ?? null,
    ready
  );

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlSessionId = params.get('sessionId');
      let parsed: StoredSession | null = null;

      const raw = sessionStorage.getItem('testSession');
      if (raw) {
        try {
          parsed = JSON.parse(raw) as StoredSession;
        } catch {
          parsed = null;
        }
      }

      if (!parsed?.sessionId && urlSessionId) {
        setLoadError('Session expired in browser. Please register again to continue.');
        return;
      }

      if (!parsed?.sessionId) {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch(
          `/api/session/progress?sessionId=${encodeURIComponent(parsed.sessionId)}`,
          { cache: 'no-store' }
        );
        const progress = await res.json();
        if (!res.ok) throw new Error(progress.error || 'Could not load session');

        if (progress.status === 'submitted') {
          sessionStorage.removeItem('testSession');
          router.replace('/complete');
          return;
        }

        if (progress.examPaper?.length) {
          parsed = { ...parsed, examPaper: progress.examPaper };
        }
        if (progress.testStartedAt) {
          parsed = { ...parsed, testStartedAt: progress.testStartedAt };
        }
        if (progress.candidate?.fullName) {
          parsed = {
            ...parsed,
            candidate: { ...parsed.candidate, ...progress.candidate },
          };
        }

        let answers: Answers | undefined = progress.draftAnswers ?? undefined;
        let index = progress.currentIndex ?? 0;
        let wasResumed = Boolean(progress.draftAnswers);

        const localRaw = sessionStorage.getItem(draftKey(parsed.sessionId));
        if (localRaw) {
          try {
            const local = JSON.parse(localRaw) as {
              answers: Answers;
              currentIndex: number;
              savedAt: string;
            };
            const serverTime = progress.draftSavedAt
              ? new Date(progress.draftSavedAt).getTime()
              : 0;
            const localTime = new Date(local.savedAt).getTime();
            if (localTime > serverTime) {
              answers = local.answers;
              index = local.currentIndex ?? 0;
              wasResumed = true;
            }
          } catch {
            // ignore corrupt local draft
          }
        }

        sessionStorage.setItem('testSession', JSON.stringify(parsed));
        setInitialAnswers(answers);
        setInitialIndex(index);
        setResumed(wasResumed);
        setSession(parsed);

        if (progress.testStartedAt && wasResumed) {
          setReady(true);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load test');
      }
    };

    load();
  }, [router]);

  useEffect(() => {
    if (!session || submitting || !ready) return;
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
  }, [session, submitting, ready]);

  useEffect(() => {
    if (!session || !ready) return;
    const warnInterval = setInterval(() => {
      const s = getState();
      setProctorWarnings(
        s.tabSwitches + s.focusLosses + s.copyEvents + s.pasteEvents + s.linksOpened.length
      );
    }, 2000);
    return () => clearInterval(warnInterval);
  }, [session, ready, getState]);

  const handleAutoSave = useCallback(
    async (answers: Answers, currentIndex: number) => {
      if (!session || submitting) return;
      const savedAt = new Date().toISOString();
      sessionStorage.setItem(
        draftKey(session.sessionId),
        JSON.stringify({ answers, currentIndex, savedAt })
      );
      try {
        await fetch('/api/session/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            answers,
            currentIndex,
          }),
        });
      } catch {
        // local backup remains
      }
    },
    [session, submitting]
  );

  const handleStart = async () => {
    await requestFullscreen();
    if (!session) return;

    const res = await fetch('/api/session/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId }),
    });
    const data = await res.json();
    const testStartedAt = res.ok ? data.testStartedAt : new Date().toISOString();

    const updated = { ...session, testStartedAt };
    setSession(updated);
    sessionStorage.setItem('testSession', JSON.stringify(updated));
    setReady(true);
  };

  const handleSubmit = useCallback(
    async (answers: Answers) => {
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
            startedAt: session.testStartedAt ?? session.startedAt,
            ...proctorState,
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Submit failed');

        sessionStorage.removeItem('testSession');
        sessionStorage.removeItem(draftKey(session.sessionId));
        sessionStorage.setItem('testResult', JSON.stringify(result));
        router.push('/complete');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
        setSubmitting(false);
      }
    },
    [session, submitting, flush, router]
  );

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{loadError}</p>
          <a href="/" className="btn-primary inline-block">Return to Home</a>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading test...</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="portal-shell min-h-screen">
        <PortalHeader />
        <div className="flex items-center justify-center p-4 py-12">
          <div className="card-elevated p-8 max-w-lg w-full text-center">
            {session.candidate.headshot ? (
              <img
                src={session.candidate.headshot}
                alt={session.candidate.fullName}
                className="w-20 h-20 rounded-full object-cover border-4 border-brand-200 shadow-md mx-auto mb-5"
              />
            ) : null}
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {resumed ? 'Resume Your Test' : 'Ready to Begin?'}
            </h1>
            <p className="text-slate-600 mb-2">
              Welcome, <strong>{session.candidate.fullName}</strong>
            </p>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {resumed
                ? 'Your previous progress was found. You can continue where you left off. Answers auto-save every few seconds.'
                : 'Your session is proctored. Progress is saved automatically — you can resume if disconnected.'}
            </p>
            <button type="button" className="btn-primary w-full" onClick={handleStart}>
              {resumed ? 'Resume Test' : 'Enter Fullscreen & Start Test'}
            </button>
            <p className="text-xs text-slate-400 mt-4">
              60-minute time limit · Auto-submit when time ends
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell min-h-screen">
      <header className="portal-header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <PortalLogo size="sm" variant="light" showText />
          <span className="text-xs text-slate-300">Proctored · Auto-saved</span>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <TestInterface
          session={{
            sessionId: session.sessionId,
            startedAt: session.startedAt,
            testStartedAt: session.testStartedAt,
          }}
          examQuestions={session.examPaper}
          initialAnswers={initialAnswers}
          initialIndex={initialIndex}
          onAutoSave={handleAutoSave}
          onSubmit={handleSubmit}
          submitting={submitting}
          proctorWarnings={proctorWarnings}
          resumed={resumed}
        />
      </div>
    </div>
  );
}
