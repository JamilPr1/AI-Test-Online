'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalHeader from '@/components/PortalHeader';
import { PLATFORM_SHORT } from '@/lib/branding';

interface TestResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  questionCount: number;
  candidateName?: string;
  headshotData?: string | null;
}

export default function CompletePage() {
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('testResult');
    if (raw) {
      try {
        setResult(JSON.parse(raw));
        sessionStorage.removeItem('testResult');
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="portal-shell min-h-screen">
      <PortalHeader />

      <div className="flex items-center justify-center p-4 py-12">
        <div className="card-elevated p-8 max-w-lg w-full text-center">
          {result ? (
            <>
              {result.headshotData && (
                <div className="mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.headshotData}
                    alt={result.candidateName || 'Candidate'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-brand-200 shadow-lg mx-auto"
                  />
                  {result.candidateName && (
                    <p className="mt-3 font-semibold text-slate-900">{result.candidateName}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{PLATFORM_SHORT} · Submission Record</p>
                </div>
              )}

              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                  result.passed ? 'bg-green-100' : 'bg-amber-100'
                }`}
              >
                {result.passed ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">Test Submitted Successfully</h1>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Thank you for completing the {PLATFORM_SHORT} technical screening.
                Your responses and verification photo have been recorded for review.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <ResultStat label="Score" value={`${result.percentage}%`} highlight />
                <ResultStat label="Points" value={`${result.score}/${result.totalPoints}`} />
                <ResultStat
                  label="Result"
                  value={result.passed ? 'Pass' : 'Review'}
                  passed={result.passed}
                />
              </div>

              <p className="text-sm text-slate-500 leading-relaxed">
                Detailed results are visible to administrators only. You will be contacted
                regarding next steps in the hiring process.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Complete</h1>
              <p className="text-slate-600 mb-6">
                Your test has been submitted. Thank you for your participation.
              </p>
              <Link href="/" className="btn-primary">
                Return to Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  highlight,
  passed,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  passed?: boolean;
}) {
  const valueClass = passed !== undefined
    ? passed
      ? 'text-green-600'
      : 'text-amber-600'
    : highlight
      ? 'text-brand-700'
      : 'text-slate-900';

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
