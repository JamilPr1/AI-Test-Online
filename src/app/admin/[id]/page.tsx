'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate, formatDuration } from '@/lib/utils';

interface QuestionReviewItem {
  id: string;
  type: string;
  category: string;
  question: string;
  points: number;
  userAnswer: unknown;
  correct?: boolean;
  earned?: number;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  instructions?: string;
  language?: string;
  criteria?: Array<{ id: string; label: string; points: number; passed: boolean }>;
  sampleSolution?: string;
}

interface DetailData {
  session: Record<string, unknown>;
  questionReview: QuestionReviewItem[];
  behaviorLog: Array<{ type: string; timestamp: string; detail?: string; url?: string }>;
  linksOpened: Array<{ url: string; timestamp: string; context: string }>;
  integrity: { level: string; flags: string[] };
}

export default function AdminDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'answers' | 'behavior' | 'links'>('answers');

  useEffect(() => {
    fetch(`/api/admin/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error('Please log in at /admin first.');
          throw new Error('Session not found.');
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  const s = data.session;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/admin" className="text-sm text-brand-600 hover:underline mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{s.full_name as string}</h1>
              <p className="text-slate-500">{s.email as string}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand-700">{s.percentage as number}%</p>
              <p className="text-sm text-slate-500">
                {s.score as number}/{s.total_points as number} points
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Candidate info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Candidate Details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Phone" value={s.phone as string} />
              <Row label="LinkedIn" value={s.linkedin as string} />
              <Row label="Experience" value={s.years_experience as string} />
              <Row label="Current Role" value={s.current_role as string} />
              <Row label="Started" value={formatDate(s.started_at as string)} />
              <Row label="Submitted" value={formatDate(s.submitted_at as string)} />
              <Row label="Time Taken" value={formatDuration(s.time_taken_seconds as number)} />
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Integrity Report</h2>
            <div className="mb-4">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  data.integrity.level === 'high'
                    ? 'bg-red-100 text-red-800'
                    : data.integrity.level === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                Risk Level: {data.integrity.level}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <Metric label="Tab Switches" value={s.tab_switches as number} />
              <Metric label="Focus Losses" value={s.focus_losses as number} />
              <Metric label="Copy Events" value={s.copy_events as number} />
              <Metric label="Paste Events" value={s.paste_events as number} />
              <Metric label="Right Clicks" value={s.right_clicks as number} />
              <Metric label="Fullscreen Exits" value={s.fullscreen_exits as number} />
              <Metric label="Links Opened" value={data.linksOpened.length} />
            </dl>
            {data.integrity.flags.length > 0 && (
              <ul className="text-sm text-red-700 space-y-1">
                {data.integrity.flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">!</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 flex">
            {(['answers', 'behavior', 'links'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'answers' && `Answers (${data.questionReview.length})`}
                {t === 'behavior' && `Behavior Log (${data.behaviorLog.length})`}
                {t === 'links' && `Links Opened (${data.linksOpened.length})`}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'answers' && (
              <div className="space-y-4">
                {data.questionReview.map((q, i) =>
                  q.type === 'coding' ? (
                    <div
                      key={q.id}
                      className={`rounded-lg border p-4 ${
                        (q.earned ?? 0) === q.points
                          ? 'border-green-200 bg-green-50/50'
                          : (q.earned ?? 0) > 0
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-red-200 bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-500">Code {i - 9}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {q.category}
                        </span>
                        <span className="text-xs text-slate-500">{q.language}</span>
                        <span className="text-xs font-medium ml-auto text-slate-700">
                          {q.earned ?? 0}/{q.points} pts
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 mb-2">{q.question}</p>
                      <pre className="rounded-lg bg-slate-900 text-green-400 p-4 text-xs overflow-x-auto font-mono leading-relaxed mb-3 max-h-64 overflow-y-auto">
                        {(q.userAnswer as string) || '(no submission)'}
                      </pre>
                      {q.criteria && (
                        <ul className="text-sm space-y-1 mb-3">
                          {q.criteria.map((c) => (
                            <li
                              key={c.id}
                              className={c.passed ? 'text-green-700' : 'text-red-600'}
                            >
                              {c.passed ? '✓' : '✗'} {c.label} ({c.points} pt{c.points !== 1 ? 's' : ''})
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.sampleSolution && (q.earned ?? 0) < q.points && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-brand-600 font-medium">
                            View sample solution
                          </summary>
                          <pre className="mt-2 rounded-lg bg-slate-100 p-3 text-xs overflow-x-auto font-mono">
                            {q.sampleSolution}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div
                      key={q.id}
                      className={`rounded-lg border p-4 ${
                        q.correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-500">Q{i + 1}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200">
                          {q.category}
                        </span>
                        <span
                          className={`text-xs font-medium ml-auto ${
                            q.correct ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {q.correct ? `+${q.points} pts` : '0 pts'}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 mb-2">{q.question}</p>
                      <p className="text-sm text-slate-600">
                        Candidate: <strong>{formatMcqAnswer(q)}</strong>
                      </p>
                      {!q.correct && (
                        <p className="text-sm text-green-700 mt-1">
                          Correct: <strong>{formatMcqCorrect(q)}</strong>
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {tab === 'behavior' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.behaviorLog.length === 0 ? (
                  <p className="text-slate-500 text-sm">No behavior events recorded.</p>
                ) : (
                  data.behaviorLog.map((e, i) => (
                    <div key={i} className="flex gap-3 text-sm py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400 font-mono text-xs whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-medium text-slate-700 w-36">{e.type}</span>
                      <span className="text-slate-600">{e.detail || e.url || '—'}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'links' && (
              <div className="space-y-3">
                {data.linksOpened.length === 0 ? (
                  <p className="text-slate-500 text-sm">No external links were opened.</p>
                ) : (
                  data.linksOpened.map((link, i) => (
                    <div key={i} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                      <p className="font-medium text-red-800 break-all">{link.url}</p>
                      <p className="text-red-600 text-xs mt-1">
                        {new Date(link.timestamp).toLocaleString()} · {link.context}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function formatMcqAnswer(q: QuestionReviewItem): string {
  const a = q.userAnswer;
  if (a === null || a === undefined) return 'Not answered';
  if (typeof a === 'number' && q.options) return q.options[a] || `Option ${a + 1}`;
  return String(a);
}

function formatMcqCorrect(q: QuestionReviewItem): string {
  const a = q.correctAnswer;
  if (typeof a === 'number' && q.options) return q.options[a] || `Option ${a + 1}`;
  return String(a);
}
