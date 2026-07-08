import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardCard from './DashboardCard';
import CircularProgressRing from './CircularProgressRing';
import AnimatedNumber from './AnimatedNumber';

export interface WeddingMilestone {
  label: string;
  done: boolean;
}

interface ProgressCardProps {
  percent: number;
  completedTasks: number;
  remainingTasks: number;
  currentMilestone: string;
  milestones: WeddingMilestone[];
  showCompleteCta?: boolean;
}

export default function ProgressCard({
  percent,
  completedTasks,
  remainingTasks,
  currentMilestone,
  milestones,
  showCompleteCta = false,
}: ProgressCardProps) {
  return (
    <DashboardCard className="flex flex-col lg:col-span-1" delay={1}>
      <div className="dp-dash-panel-body flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="dp-dash-section-title !mb-0">Wedding Progress</h2>
          <span className="rounded-full bg-[#ffeef1] px-2.5 py-0.5 text-xs font-bold text-[#f4196d]">
            <AnimatedNumber value={percent} suffix="%" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <CircularProgressRing percent={percent} size={80} strokeWidth={6} gradientId="dpDashProgressGrad" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-extrabold text-[#f4196d]">{percent}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs text-[#6a737c]">
              <span className="font-bold text-[#242729]">{completedTasks}</span> completed
            </p>
            <p className="text-xs text-[#6a737c]">
              <span className="font-bold text-[#242729]">{remainingTasks}</span> remaining
            </p>
            <p className="truncate text-[11px] font-semibold text-[#f4196d]">
              Current: {currentMilestone}
            </p>
          </div>
        </div>

        <ul className="mt-3 max-h-[200px] flex-1 space-y-1.5 overflow-y-auto pr-1">
          {milestones.map((step, i) => (
            <motion.li
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${
                  step.done ? 'bg-[#10b981]' : 'border-2 border-[#ebebeb] bg-white'
                }`}
              >
                {step.done ? (
                  <Check size={9} strokeWidth={3} />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-[#d6d9dc]" />
                )}
              </span>
              <span
                className={`text-[11px] leading-tight ${step.done ? 'font-semibold text-[#242729]' : 'text-[#6a737c]'}`}
              >
                {step.label}
              </span>
            </motion.li>
          ))}
        </ul>

        {showCompleteCta && (
          <Link to="/app/profile/edit" className="dp-connect-btn mt-3 text-center text-xs">
            Complete Profile
          </Link>
        )}
      </div>
    </DashboardCard>
  );
}
