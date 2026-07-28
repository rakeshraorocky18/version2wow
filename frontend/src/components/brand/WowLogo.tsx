import { Link } from 'react-router-dom';

type WowLogoVariant = 'auth' | 'sidebar' | 'header' | 'compact';

interface WowLogoProps {
  /** Size/color only — the mark and tagline are always the same. */
  variant?: WowLogoVariant;
  to?: string;
  className?: string;
  showTagline?: boolean;
}

/** Clean outline heart — scales consistently across sizes. */
function HeartMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M12 20.4S3.6 14.9 3.6 9.4A4.35 4.35 0 0 1 12 6.85 4.35 4.35 0 0 1 20.4 9.4C20.4 14.9 12 20.4 12 20.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Site-wide brand mark: W♡W + WORLD OF WEDDINGS
 * Use this component everywhere — do not recreate the logo inline.
 */
export default function WowLogo({
  variant = 'auth',
  to,
  className = '',
  showTagline = true,
}: WowLogoProps) {
  const isDark = variant === 'sidebar';
  const isCompact = variant === 'compact' || variant === 'header';

  const markSize = isCompact
    ? 'text-[1.65rem] leading-none'
    : variant === 'auth'
      ? 'text-[2.65rem] sm:text-[2.85rem] leading-none'
      : 'text-[2.15rem] leading-none';

  const heartSize = isCompact
    ? 'h-[1.25rem] w-[1.25rem]'
    : variant === 'auth'
      ? 'h-[2rem] w-[2rem] sm:h-[2.15rem] sm:w-[2.15rem]'
      : 'h-[1.65rem] w-[1.65rem]';

  const tagSize = isCompact
    ? 'text-[7px] tracking-[0.28em]'
    : variant === 'auth'
      ? 'text-[9px] sm:text-[10px] tracking-[0.32em]'
      : 'text-[9px] tracking-[0.3em]';

  const mark = (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className={`inline-flex items-center justify-center font-display font-bold tracking-[-0.02em] ${markSize} ${
          isDark ? 'text-white' : 'text-[#E91E63]'
        }`}
        aria-label="WOW — World of Weddings"
      >
        <span className="select-none">W</span>
        <span
          className={`inline-flex items-center justify-center mx-[0.18em] ${
            isDark ? 'text-[#FF4D8D]' : 'text-[#E91E63]'
          }`}
        >
          <HeartMark className={heartSize} />
        </span>
        <span className="select-none">W</span>
      </div>

      {showTagline && (
        <p
          className={`mt-1.5 whitespace-nowrap font-sans font-medium uppercase ${tagSize} ${
            isDark ? 'text-white/65' : 'text-[#E91E63]/75'
          }`}
        >
          WORLD OF WEDDINGS
        </p>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex w-full justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E91E63]/40 rounded-lg"
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
