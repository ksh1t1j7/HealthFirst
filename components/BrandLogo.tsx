import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

export default function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl border border-white/50 bg-white/45 shadow-[0_12px_24px_rgba(111,76,255,0.18)] backdrop-blur-md',
        sizeMap[size],
        className
      )}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="hfLogoBg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8C5BFF" />
            <stop offset="100%" stopColor="#5FD7E7" />
          </linearGradient>
          <linearGradient id="hfLogoStroke" x1="16" y1="12" x2="48" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EAF7FF" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#hfLogoBg)" />
        <path
          d="M20 21h6v9h12v-9h6v22h-6v-8H26v8h-6V21Z"
          fill="url(#hfLogoStroke)"
        />
        <path
          d="M43 14c0 4.7-4.2 8.1-11 13.8C25.2 22.1 21 18.7 21 14c0-3.1 2.4-5.5 5.4-5.5 2.2 0 4.2 1.2 5.6 3 1.4-1.8 3.4-3 5.6-3C40.6 8.5 43 10.9 43 14Z"
          fill="rgba(255,255,255,0.22)"
        />
      </svg>
    </div>
  );
}
