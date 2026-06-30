import { PLATFORM_SHORT, PLATFORM_TAGLINE } from '@/lib/branding';

interface PortalLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const sizes = {
  sm: { box: 'w-9 h-9 text-sm', title: 'text-sm', tag: 'text-[10px]' },
  md: { box: 'w-11 h-11 text-base', title: 'text-base', tag: 'text-xs' },
  lg: { box: 'w-14 h-14 text-xl', title: 'text-xl', tag: 'text-sm' },
};

export default function PortalLogo({
  size = 'md',
  showText = true,
  variant = 'dark',
}: PortalLogoProps) {
  const s = sizes[size];
  const textClass = variant === 'light' ? 'text-white' : 'text-slate-900';
  const tagClass = variant === 'light' ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.box} rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-600/20`}
      >
        AD
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={`${s.title} font-bold leading-tight ${textClass}`}>{PLATFORM_SHORT}</p>
          <p className={`${s.tag} ${tagClass}`}>{PLATFORM_TAGLINE}</p>
        </div>
      )}
    </div>
  );
}
