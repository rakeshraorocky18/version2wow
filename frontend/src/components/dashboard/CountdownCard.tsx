import { motion } from 'framer-motion';
import DashboardCard from './DashboardCard';
import CircularProgressRing from './CircularProgressRing';
import AnimatedNumber from './AnimatedNumber';

interface CountdownCardProps {
  daysLeft: number;
  weddingDate: string;
  weddingDateLabel: string;
  totalDays?: number;
}

export default function CountdownCard({
  daysLeft,
  weddingDate,
  weddingDateLabel,
  totalDays = 365,
}: CountdownCardProps) {
  const elapsed = Math.max(0, totalDays - daysLeft);
  const progressPercent = Math.min(100, Math.round((elapsed / totalDays) * 100));

  return (
    <DashboardCard delay={3}>
      <div className="dp-dash-panel-body flex flex-col items-center text-center">
        <span className="text-2xl">💕</span>
        <h2 className="dp-dash-section-title mt-1">Wedding Countdown</h2>

        <div className="relative my-3">
          <CircularProgressRing
            percent={progressPercent}
            size={96}
            strokeWidth={7}
            gradientId="dpDashProgressGrad"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber value={daysLeft} className="text-2xl font-extrabold text-[#f4196d]" />
            <span className="text-[10px] font-semibold text-[#6a737c]">Days Left</span>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-[rgba(0,0,0,0.04)] bg-[#f7f8fa] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6a737c]">
            Wedding Date
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-[#242729]">{weddingDateLabel}</p>
          <p className="text-[11px] text-[#6a737c]">{weddingDate}</p>
        </div>

        <motion.div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#ebebeb]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#f4196d] to-[#ff90b5]"
            initial={{ width: 0 }}
            whileInView={{ width: `${progressPercent}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      </div>
    </DashboardCard>
  );
}
