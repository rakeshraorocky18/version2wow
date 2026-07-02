import { CalendarRange, CheckCircle2, Circle, Flag } from 'lucide-react';
import type { PlannerTaskWithSubtasks, TimelineBucket } from '../../types/planner';
import { TIMELINE_BUCKETS } from '../../types/planner';
import {
  getCategoryMeta,
  getDueDateCountdown,
  getPriorityMeta,
  groupTasksByTimeline,
  isTaskComplete,
} from '../../lib/plannerUtils';

interface PlannerTimelineProps {
  tasks: PlannerTaskWithSubtasks[];
  weddingDate: string;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

const bucketColors: Record<TimelineBucket, string> = {
  '12 Months Before': 'border-violet-200 bg-violet-50/50',
  '6 Months Before': 'border-indigo-200 bg-indigo-50/50',
  '3 Months Before': 'border-blue-200 bg-blue-50/50',
  '1 Month Before': 'border-amber-200 bg-amber-50/50',
  '1 Week Before': 'border-orange-200 bg-orange-50/50',
  'Wedding Day': 'border-rose-200 bg-rose-50/50',
};

export default function PlannerTimeline({ tasks, weddingDate, onToggleTask }: PlannerTimelineProps) {
  const grouped = groupTasksByTimeline(tasks, weddingDate);
  const nonEmptyBuckets = TIMELINE_BUCKETS.filter((bucket) => grouped[bucket].length > 0);

  if (nonEmptyBuckets.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#F2DFE8] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8F5FF] text-[#6E4A9C]">
          <CalendarRange size={18} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Planner Timeline</h2>
          <p className="text-xs text-[#9A5776]">Tasks grouped by wedding countdown milestones</p>
        </div>
      </div>

      <div className="space-y-5">
        {nonEmptyBuckets.map((bucket) => (
          <div key={bucket} className={`rounded-2xl border p-4 ${bucketColors[bucket]}`}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#5D2B44]">{bucket}</h3>
            <ul className="space-y-2">
              {grouped[bucket].map((task) => {
                const complete = isTaskComplete(task);
                const hasSubtasks = task.subtasks.length > 0;
                const priority = getPriorityMeta(task.priorityLevel);
                const countdown = getDueDateCountdown(task.dueDate, complete ? 'completed' : task.status);

                return (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm"
                  >
                    {!hasSubtasks && (
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id, !complete)}
                        className="shrink-0"
                        aria-label={complete ? 'Mark pending' : 'Mark completed'}
                      >
                        {complete ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : (
                          <Circle size={18} className="text-[#D4A8BC]" />
                        )}
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${complete ? 'text-[#9A5776] line-through' : 'text-[#5D2B44]'}`}>
                        {task.title}
                      </p>
                      {countdown && <p className="text-[11px] text-[#9A5776]">{countdown}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      {task.category && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getCategoryMeta(task.category)}`}>
                          {task.category}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${priority.className}`}>
                        <Flag size={9} />
                        {priority.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
