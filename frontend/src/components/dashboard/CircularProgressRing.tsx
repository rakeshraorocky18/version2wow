import { motion } from 'framer-motion';

interface CircularProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  gradientId?: string;
}

export default function CircularProgressRing({
  percent,
  size = 120,
  strokeWidth = 9,
  gradientId = 'wowProgressGrad',
}: CircularProgressRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const cx = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className="wow-progress-ring-svg"
      aria-label={`${percent}% complete`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4196d" />
          <stop offset="100%" stopColor="#ff90b5" />
        </linearGradient>
        <linearGradient id="dpDashProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4196d" />
          <stop offset="100%" stopColor="#ff90b5" />
        </linearGradient>
        <linearGradient id="shaadiProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e52727" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#F5E6EB" strokeWidth={strokeWidth} />
      <motion.circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
