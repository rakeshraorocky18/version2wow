import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import AnimatedNumber from './AnimatedNumber';
import { fadeSlideUp } from './motion';

interface StatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  subtitle: string;
  to: string;
  accent: string;
  iconBg: string;
  delay?: number;
  animateValue?: boolean;
  compact?: boolean;
}

export default function StatsCard({
  icon,
  value,
  label,
  subtitle,
  to,
  delay = 0,
  animateValue = true,
  compact = false,
}: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <motion.div custom={delay} variants={fadeSlideUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <Link to={to} className={`dp-dash-stat-card ${compact ? '!p-3' : ''}`}>
        <div className="dp-dash-stat-card__icon">{icon}</div>
        <div>
          <p className={`dp-dash-stat-card__value ${compact ? '!text-xl' : ''}`}>
            {numericValue !== null && animateValue ? (
              <AnimatedNumber value={numericValue} />
            ) : (
              value
            )}
          </p>
          <p className="dp-dash-stat-card__label">{label}</p>
          <p className="dp-dash-stat-card__sub">{subtitle}</p>
        </div>
      </Link>
    </motion.div>
  );
}
