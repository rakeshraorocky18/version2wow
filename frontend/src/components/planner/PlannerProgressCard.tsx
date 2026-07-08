import type { PlannerProgress } from '../../types/planner';
import { getProgressColor, getProgressTextColor, getProgressTrackColor } from '../../lib/plannerUtils';

interface PlannerProgressCardProps {
  progress: PlannerProgress;
}

export default function PlannerProgressCard({ progress }: PlannerProgressCardProps) {
  const { completed, total, percentage } = progress;

  return (
    <div className="rounded-2xl border border-[#F2DFE8] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Planning Progress</h2>
          <p className="mt-0.5 text-sm text-[#9A5776]">Track your wedding checklist completion</p>
        </div>
        <div className="text-right">
          <p className={`font-display text-3xl font-bold ${getProgressTextColor(percentage)}`}>{percentage}%</p>
          <p className="text-sm text-[#815A6D]">
            {completed} / {total} tasks completed
          </p>
        </div>
      </div>

      <div className={`h-4 overflow-hidden rounded-full ${getProgressTrackColor(percentage)}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(percentage)} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#9A5776]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> 0–30%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> 31–70%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> 71–100%
        </span>
      </div>
    </div>
  );
}
