'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeadshotCapture from '@/components/HeadshotCapture';

export default function CandidateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [headshotError, setHeadshotError] = useState('');
  const [headshot, setHeadshot] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    yearsExperience: '',
    currentRole: '',
  });
  const [agreed, setAgreed] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headshot) {
      setHeadshotError('Please capture or upload your headshot selfie.');
      return;
    }
    if (!agreed) {
      setError('Please accept the test integrity policy to continue.');
      return;
    }

    setLoading(true);
    setError('');
    setHeadshotError('');

    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          headshot,
          yearsExperience: form.yearsExperience,
          currentRole: form.currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start session');

      sessionStorage.setItem(
        'testSession',
        JSON.stringify({
          sessionId: data.sessionId,
          startedAt: data.startedAt,
          examPaper: data.examPaper,
          candidate: { fullName: form.fullName, email: form.email, headshot },
        })
      );

      router.push('/test');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <HeadshotCapture
        value={headshot}
        onChange={(data) => {
          setHeadshot(data);
          setHeadshotError('');
        }}
        error={headshotError}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="fullName">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            className="input-field"
            required
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="jane.smith@email.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className="input-field"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="label" htmlFor="yearsExperience">
            Years of AI/ML Experience <span className="text-red-500">*</span>
          </label>
          <select
            id="yearsExperience"
            className="input-field"
            required
            value={form.yearsExperience}
            onChange={(e) => update('yearsExperience', e.target.value)}
          >
            <option value="">Select experience level</option>
            <option value="0-1">0–1 years</option>
            <option value="1-3">1–3 years</option>
            <option value="3-5">3–5 years</option>
            <option value="5-8">5–8 years</option>
            <option value="8+">8+ years</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="currentRole">
            Current Role / Title
          </label>
          <input
            id="currentRole"
            className="input-field"
            value={form.currentRole}
            onChange={(e) => update('currentRole', e.target.value)}
            placeholder="ML Engineer, Data Scientist, etc."
          />
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <p className="font-semibold mb-2">Test Integrity Policy</p>
        <ul className="list-disc list-inside space-y-1 text-amber-800">
          <li>Duration: 60 minutes · 15 MCQ + 2 coding exercises · Auto-graded</li>
          <li>Tab switches, focus changes, and external links are monitored</li>
          <li>Copy/paste and right-click are disabled during the test</li>
          <li>Fullscreen mode is recommended for the best experience</li>
          <li>Do not use external resources or assistance during the test</li>
        </ul>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-slate-600">
          I confirm that the information provided is accurate and I agree to complete this
          assessment independently without unauthorized assistance.
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full md:w-auto" disabled={loading}>
        {loading ? 'Starting Test...' : 'Begin Technical Screening'}
      </button>
    </form>
  );
}
