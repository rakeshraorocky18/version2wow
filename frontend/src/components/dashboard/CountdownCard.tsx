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
  const accentText = daysLeft > 0 ? `${daysLeft} days to go` : 'Set your date to begin';

  return (
    <DashboardCard delay={3}>
      <div className="dp-dash-panel-body wow-countdown-card relative flex flex-col items-center overflow-hidden text-center">
        <motion.span
          className="wow-countdown-card__glow"
          aria-hidden
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="relative z-[1] text-xl"
          animate={{ y: [0, -5, 0], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          💕
        </motion.span>
        <h2 className="dp-dash-section-title mt-1">Wedding Countdown</h2>

        <motion.div
          className="relative my-2.5"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <CircularProgressRing
            percent={progressPercent}
            size={84}
            strokeWidth={6}
            gradientId="dpDashProgressGrad"
          />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AnimatedNumber value={daysLeft} className="text-xl font-extrabold text-[#f4196d]" />
            <span className="text-[10px] font-semibold text-[#6a737c]">Days Left</span>
          </motion.div>
        </motion.div>

        <motion.p
          className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b76e79]"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08, duration: 0.35 }}
        >
          {accentText}
        </motion.p>

        <motion.div
          className="w-full rounded-2xl border border-[rgba(0,0,0,0.04)] bg-[#f7f8fa] px-3 py-2.5"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6a737c]">
            Wedding Date
          </p>
          <p className="mt-0.5 text-[13px] font-extrabold text-[#242729]">{weddingDateLabel}</p>
          <p className="text-[11px] text-[#6a737c]">{weddingDate}</p>
        </motion.div>

        <motion.div
          className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#ebebeb]"
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
