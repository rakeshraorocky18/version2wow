interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
}

export default function CompatibilityBadge({
  score,
  size = 'sm',
  glow = false,
  className = '',
}: Props) {
  const sizeClass =
    size === 'lg'
      ? 'px-3 py-1.5 text-sm'
      : size === 'md'
        ? 'px-2.5 py-1 text-xs'
        : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-wow-primary font-bold text-white shadow-sm transition duration-300 ${sizeClass} ${
        glow ? 'shadow-wow-primary/40 ring-2 ring-wow-primary/30' : ''
      } ${className}`}
      aria-label={`${score}% compatibility`}
    >
      {score}%
    </span>
  );
}
