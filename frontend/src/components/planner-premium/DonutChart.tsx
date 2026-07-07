import { useMemo } from 'react';

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export default function DonutChart({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const gradientId = useMemo(() => `donut-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF5C8D" />
            <stop offset="100%" stopColor="#C8A2C8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,182,193,0.25)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-romantic-rose dark:text-romantic-blush">
          {Math.round(percentage)}%
        </span>
        {label && <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</span>}
      </div>
      {sublabel && (
        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>
      )}
    </div>
  );
}
