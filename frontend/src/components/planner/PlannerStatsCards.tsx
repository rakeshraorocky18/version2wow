import { CalendarDays, CheckCircle2, CircleDashed, ListTodo } from 'lucide-react';
import type { PlannerProgress } from '../../types/planner';
import { getProgressTextColor } from '../../lib/plannerUtils';

interface PlannerStatsCardsProps {
  weddingDate: string;
  daysRemaining: number;
  progress: PlannerProgress;
}

const cards = [
  { key: 'total', label: 'Total Tasks', icon: ListTodo, color: 'text-[#6E4A9C]', bg: 'bg-[#F8F5FF]' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'pending', label: 'Pending', icon: CircleDashed, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'days', label: 'Days Left', icon: CalendarDays, color: 'text-[#B66A8A]', bg: 'bg-[#FFF5F8]' },
] as const;

export default function PlannerStatsCards({ weddingDate, daysRemaining, progress }: PlannerStatsCardsProps) {
  const values = {
    total: progress.total,
    completed: progress.completed,
    pending: progress.pending,
    days: Math.max(daysRemaining, 0),
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="rounded-2xl border border-[#F2DFE8] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#9A5776]">{label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${key === 'days' ? 'text-[#B66A8A]' : 'text-[#5D2B44]'}`}>
                {values[key]}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
              <Icon size={18} className={color} />
            </div>
          </div>
          {key === 'days' && (
            <p className="mt-2 text-[11px] text-[#815A6D]">
              Wedding: {new Date(weddingDate).toLocaleDateString()}
            </p>
          )}
          {key === 'completed' && (
            <p className={`mt-2 text-[11px] font-semibold ${getProgressTextColor(progress.percentage)}`}>
              {progress.percentage}% overall
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
