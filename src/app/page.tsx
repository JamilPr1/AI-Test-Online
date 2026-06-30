import CandidateForm from '@/components/CandidateForm';
import PortalHeader from '@/components/PortalHeader';
import { PLATFORM_NAME } from '@/lib/branding';
import { getTotalPoints, MCQ_PER_EXAM } from '@/lib/questions';

export default function HomePage() {
  const totalPoints = getTotalPoints();

  return (
    <div className="portal-shell">
      <PortalHeader />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <section className="portal-hero mb-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative">
            <p className="stat-pill mb-4 w-fit">Hiring Assessment</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 max-w-2xl">
              {PLATFORM_NAME}
            </h1>
            <p className="text-slate-200 text-lg max-w-xl leading-relaxed">
              Register below to begin your timed technical screening. Ensure a stable connection
              and 60 uninterrupted minutes in a quiet environment.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Candidate Registration</h2>
                  <p className="text-sm text-slate-500">Complete your profile to start the assessment</p>
                </div>
              </div>
              <CandidateForm />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                Test Overview
              </h3>
              <dl className="space-y-3 text-sm">
                <OverviewRow label="Duration" value="60 minutes" />
                <OverviewRow label="Questions" value={`${MCQ_PER_EXAM} MCQ + 2 coding`} />
                <OverviewRow label="Total Points" value={`${totalPoints} points`} />
                <OverviewRow label="Passing Score" value="60%" />
                <OverviewRow label="Format" value="MCQ + Coding" />
              </dl>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                Topics Covered
              </h3>
              <ul className="text-sm text-slate-600 space-y-2.5">
                {[
                  'Machine Learning & TensorFlow',
                  'NLP & Unsupervised Learning',
                  'Big Data (Hadoop, Spark)',
                  'API Security & SQL Injection',
                  'Secure REST Endpoint Design',
                ].map((topic) => (
                  <li key={topic} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-brand-50 border border-brand-200 p-5 text-sm text-brand-900">
              <p className="font-semibold mb-1">Identity verification</p>
              <p className="text-brand-800/80 leading-relaxed">
                A headshot selfie is required at registration and will be attached to your submission
                for review by the Arfa Developers hiring team.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-8 text-center text-sm text-slate-400">
        {PLATFORM_NAME} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
