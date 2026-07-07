import { Activity, CheckCircle2, Pencil, PlusCircle } from 'lucide-react';
import type { PlannerActivity } from '../../types/planner';
import { formatActivityTime, getActivityLabel } from '../../lib/plannerUtils';

interface PlannerRecentActivityProps {
  activities: PlannerActivity[];
}

const actionIcons = {
  added: PlusCircle,
  completed: CheckCircle2,
  updated: Pencil,
} as const;

const actionColors = {
  added: 'bg-blue-50 text-blue-600',
  completed: 'bg-emerald-50 text-emerald-600',
  updated: 'bg-amber-50 text-amber-600',
} as const;

export default function PlannerRecentActivity({ activities }: PlannerRecentActivityProps) {
  if (!activities.length) {
    return (
      <section className="rounded-2xl border border-[#F2DFE8] bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Recent Activity</h2>
        <p className="mt-3 text-sm text-[#9A5776]">Activity will appear here as you plan.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#F2DFE8] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF5F8] text-[#B66A8A]">
          <Activity size={18} />
        </div>
        <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Recent Activity</h2>
      </div>

      <ul className="space-y-3">
        {activities.map((item) => {
          const Icon = actionIcons[item.action] || Pencil;
          const color = actionColors[item.action] || actionColors.updated;
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-[#FAF0F4] bg-[#FFFBFC] p-3 transition hover:bg-[#FFF5F8]"
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#5D2B44]">
                  {getActivityLabel(item.action)}: <span className="text-[#815A6D]">{item.taskTitle}</span>
                </p>
                {item.details && <p className="mt-0.5 text-xs text-[#9A5776]">{item.details}</p>}
                <p className="mt-1 text-[11px] text-[#C4A0B0]">{formatActivityTime(item.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
