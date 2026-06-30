export const ADMIN_COOKIE = 'admin_auth';

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || 'admin123';
  return password === expected;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
