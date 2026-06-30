'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PortalLogo from '@/components/PortalLogo';
import { PLATFORM_SHORT } from '@/lib/branding';
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
  has_headshot?: boolean;
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
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'submitted' | 'passed' | 'flagged'>('all');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setSessions([]);
    setStats(null);
  };

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
    if (filter === 'in_progress') return s.status === 'in_progress';
    if (filter === 'submitted') return s.status === 'submitted';
    if (filter === 'passed') return s.status === 'submitted' && s.percentage >= 60;
    if (filter === 'flagged') return s.integrity?.level !== 'low';
    return true;
  });

  if (!authenticated) {
    return (
      <div className="portal-shell min-h-screen flex items-center justify-center p-4">
        <div className="card-elevated p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <PortalLogo size="lg" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{PLATFORM_SHORT} · Screening Results</p>
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
          <Link href="/" className="block text-center text-sm text-brand-600 mt-6 hover:underline">
            Back to candidate portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell min-h-screen">
      <header className="portal-header sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PortalLogo size="sm" variant="light" />
            <div className="hidden sm:block h-8 w-px bg-white/20" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">Admin Dashboard</p>
              <p className="text-xs text-slate-300">Screening results & integrity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-secondary text-sm !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
              Candidate Portal
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary text-sm !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              Sign Out
            </button>
          </div>
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
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
            <div className="flex flex-wrap gap-2">
              {(['all', 'in_progress', 'submitted', 'passed', 'flagged'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                    <tr key={s.id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {s.has_headshot ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            ) : (
                              s.full_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{s.full_name}</p>
                            <p className="text-slate-500 text-xs">{s.email}</p>
                          </div>
                        </div>
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
                        {s.status === 'in_progress' ? (
                          <>
                            <p className="text-blue-600 text-xs font-medium">Active now</p>
                            <p className="text-xs text-slate-400">{formatDate(s.started_at)}</p>
                          </>
                        ) : (
                          <>
                            <p>{formatDate(s.submitted_at)}</p>
                            <p className="text-xs text-slate-400">
                              {formatDuration(s.time_taken_seconds)}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.status === 'submitted' ? (
                          <Link
                            href={`/admin/${s.id}`}
                            className="text-brand-600 hover:text-brand-700 font-semibold"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">In test…</span>
                        )}
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
