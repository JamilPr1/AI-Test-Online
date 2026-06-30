import CandidateForm from '@/components/CandidateForm';
import Link from 'next/link';
import { getTotalPoints, MCQ_PER_EXAM } from '@/lib/questions';

export default function HomePage() {
  const totalPoints = getTotalPoints();
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">AI Developer Screening</h1>
              <p className="text-xs text-slate-500">Technical Assessment Portal</p>
            </div>
          </div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Candidate Registration</h2>
              <p className="text-slate-600 mb-8">
                Complete your details below to begin the AI Developer technical screening test.
                Please ensure you have a stable internet connection and 60 uninterrupted minutes.
              </p>
              <CandidateForm />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Test Overview</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Duration</dt>
                  <dd className="font-medium">60 minutes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Questions</dt>
                  <dd className="font-medium">{MCQ_PER_EXAM} MCQ + 2 coding</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Total Points</dt>
                  <dd className="font-medium">{totalPoints} points</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Passing Score</dt>
                  <dd className="font-medium">60%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Format</dt>
                  <dd className="font-medium">MCQ + Coding</dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Topics Covered</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Machine Learning & TensorFlow
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  NLP & Unsupervised Learning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Big Data (Hadoop, Spark)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  API Security & SQL Injection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Secure REST Endpoint Design
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-sm text-slate-400">
        AI Developer Technical Screening &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
