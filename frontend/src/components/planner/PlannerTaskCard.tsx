import { CheckCircle2, Circle, Flag } from 'lucide-react';
import type { PlannerTaskWithSubtasks } from '../../types/planner';
import {
  getCategoryMeta,
  getDueDateBadgeClass,
  getDueDateCountdown,
  getDueDateStatus,
  getPriorityMeta,
  getSubtaskProgress,
  isTaskComplete,
} from '../../lib/plannerUtils';
import PlannerSubtaskList from './PlannerSubtaskList';

interface PlannerTaskCardProps {
  task: PlannerTaskWithSubtasks;
  onToggle: (taskId: string, completed: boolean) => void;
  onToggleSubtask: (taskId: string, completed: boolean) => void;
}

export default function PlannerTaskCard({ task, onToggle, onToggleSubtask }: PlannerTaskCardProps) {
  const complete = isTaskComplete(task);
  const hasSubtasks = task.subtasks.length > 0;
  const subProgress = getSubtaskProgress(task);
  const dueStatus = getDueDateStatus(task.dueDate, complete ? 'completed' : task.status);
  const dueCountdown = getDueDateCountdown(task.dueDate, complete ? 'completed' : task.status);
  const priority = getPriorityMeta(task.priorityLevel);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
        complete ? 'border-emerald-100 bg-emerald-50/30' : 'border-[#F2DFE8]'
      } ${dueStatus === 'overdue' && !complete ? 'ring-1 ring-red-100' : ''}`}
    >
      <div className="flex gap-3">
        {!hasSubtasks && (
          <button
            type="button"
            onClick={() => onToggle(task.id, !complete)}
            className="mt-0.5 shrink-0 transition hover:scale-110"
            aria-label={complete ? 'Mark pending' : 'Mark completed'}
          >
            {complete ? (
              <CheckCircle2 size={22} className="text-emerald-500" />
            ) : (
              <Circle size={22} className="text-[#D4A8BC]" />
            )}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3
                className={`font-display text-base font-semibold ${
                  complete ? 'text-[#9A5776] line-through' : 'text-[#5D2B44]'
                }`}
              >
                {task.title}
              </h3>
              {subProgress && (
                <p className="mt-1 text-xs text-[#9A5776]">
                  {subProgress.done}/{subProgress.total} subtasks · {subProgress.percentage}%
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {task.category && (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${getCategoryMeta(task.category)}`}>
                  {task.category}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${priority.className}`}>
                <Flag size={10} className={priority.iconClass} />
                {priority.label}
              </span>
            </div>
          </div>

          {dueCountdown && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getDueDateBadgeClass(dueStatus)}`}>
                {dueCountdown}
              </span>
              {task.dueDate && (
                <span className="text-[11px] text-[#9A5776]">
                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          )}

          {hasSubtasks && subProgress && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F4E4EC]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B66A8A] to-[#6E4A9C] transition-all duration-500"
                style={{ width: `${subProgress.percentage}%` }}
              />
            </div>
          )}

          {hasSubtasks && (
            <PlannerSubtaskList
              subtasks={task.subtasks}
              onToggle={(subtaskId, completed) => onToggleSubtask(subtaskId, completed)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
