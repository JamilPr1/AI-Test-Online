'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate, formatDuration } from '@/lib/utils';

interface Session {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  years_experience: string | null;
  current_role: string | null;
  status: string;
  score: number;
  total_points: number;
  percentage: number;
  tab_switches: number;
  focus_losses: number;
  copy_events: number;
  paste_events: number;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  integrity: { level: string; flags: string[] };
}

interface Stats {
  total: number;
  submitted: number;
  inProgress: number;
  passed: number;
  avgScore: number;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'passed' | 'flagged'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoginError('');
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (res.status === 401) {
        setAuthenticated(false);
        setLoginError('');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoginError(
          (data as { error?: string }).error ||
            'Could not load results. Please try signing in again.'
        );
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setSessions(data.sessions);
      setStats(data.stats);
      setAuthenticated(true);
      setLoginError('');
    } catch {
      setLoginError(
        'Could not reach the server. If you just logged in, the database connection may be misconfigured.'
      );
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoginError(data.error || 'Login failed');
      return;
    }
    setPassword('');
    await fetchData();
  };

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'submitted') return s.status === 'submitted';
    if (filter === 'passed') return s.status === 'submitted' && s.percentage >= 60;
    if (filter === 'flagged') return s.integrity?.level !== 'low';
    return true;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <div className="card p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Enter password to view test results</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button type="submit" className="btn-primary w-full">Sign In</button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-4">
            Default password: admin123 (set ADMIN_PASSWORD in .env)
          </p>
          <Link href="/" className="block text-center text-sm text-brand-600 mt-4 hover:underline">
            Back to candidate portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">AI Developer Screening Results</p>
          </div>
          <Link href="/" className="btn-secondary text-sm">Candidate Portal</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total Attempts" value={stats.total} />
            <StatCard label="Submitted" value={stats.submitted} />
            <StatCard label="In Progress" value={stats.inProgress} color="amber" />
            <StatCard label="Passed (≥60%)" value={stats.passed} color="green" />
            <StatCard label="Avg Score" value={`${stats.avgScore}%`} color="brand" />
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'submitted', 'passed', 'flagged'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search by name or email..."
              className="input-field max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No results found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Candidate</th>
                    <th className="text-left px-4 py-3 font-medium">Experience</th>
                    <th className="text-left px-4 py-3 font-medium">Score</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Integrity</th>
                    <th className="text-left px-4 py-3 font-medium">Tab Switches</th>
                    <th className="text-left px-4 py-3 font-medium">Submitted</th>
                    <th className="text-left px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{s.full_name}</p>
                        <p className="text-slate-500 text-xs">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.years_experience || '—'}
                        {s.current_role && (
                          <p className="text-xs text-slate-400">{s.current_role}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.status === 'submitted' ? (
                          <span
                            className={`font-semibold ${
                              s.percentage >= 60 ? 'text-green-600' : 'text-amber-600'
                            }`}
                          >
                            {s.percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} passed={s.percentage >= 60} />
                      </td>
                      <td className="px-4 py-3">
                        <IntegrityBadge level={s.integrity?.level || 'low'} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.tab_switches}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{formatDate(s.submitted_at)}</p>
                        <p className="text-xs text-slate-400">
                          {formatDuration(s.time_taken_seconds)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/${s.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'slate',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    slate: 'text-slate-900',
    green: 'text-green-600',
    amber: 'text-amber-600',
    brand: 'text-brand-700',
  };
  return (
    <div className="card p-4">
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status, passed }: { status: string; passed: boolean }) {
  if (status === 'in_progress') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        In Progress
      </span>
    );
  }
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        passed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {passed ? 'Passed' : 'Below Pass'}
    </span>
  );
}

function IntegrityBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}
