import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeSlideUp } from './motion';

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  noHover?: boolean;
}

export default function DashboardCard({
  children,
  className = '',
  delay = 0,
  noHover = false,
}: DashboardCardProps) {
  return (
    <motion.div
      custom={delay}
      variants={fadeSlideUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      whileHover={noHover ? undefined : { y: -3, transition: { duration: 0.25 } }}
      className={`${className}`}
      data-dash-card
      data-no-hover={noHover ? '' : undefined}
    >
      {children}
    </motion.div>
  );
}
