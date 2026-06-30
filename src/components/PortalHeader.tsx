import Link from 'next/link';
import PortalLogo from './PortalLogo';

interface PortalHeaderProps {
  variant?: 'candidate' | 'admin';
  actions?: React.ReactNode;
}

export default function PortalHeader({ variant = 'candidate', actions }: PortalHeaderProps) {
  return (
    <header className="portal-header">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <PortalLogo size="md" variant="light" />
        </Link>
        <div className="flex items-center gap-3">
          {variant === 'candidate' && (
            <Link href="/admin" className="text-sm text-slate-300 hover:text-white transition-colors">
              Admin
            </Link>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
