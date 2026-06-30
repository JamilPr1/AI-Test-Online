'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TestResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  questionCount: number;
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="card p-8 max-w-lg w-full text-center">
        {result ? (
          <>
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                result.passed ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              {result.passed ? (
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Test Submitted Successfully</h1>
            <p className="text-slate-600 mb-6">
              Thank you for completing the AI Developer technical screening.
              Your responses have been recorded and will be reviewed by our hiring team.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-brand-700">{result.percentage}%</p>
                <p className="text-xs text-slate-500 mt-1">Score</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-slate-900">
                  {result.score}/{result.totalPoints}
                </p>
                <p className="text-xs text-slate-500 mt-1">Points</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-amber-600'}`}>
                  {result.passed ? 'Pass' : 'Review'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Result</p>
              </div>
            </div>

            <p className="text-sm text-slate-500">
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
  );
}
