import { CheckCircle2, Circle } from 'lucide-react';
import type { WeddingTask } from '../../types/planner';

interface PlannerSubtaskListProps {
  subtasks: WeddingTask[];
  onToggle: (taskId: string, completed: boolean) => void;
}

export default function PlannerSubtaskList({ subtasks, onToggle }: PlannerSubtaskListProps) {
  return (
    <ul className="mt-4 space-y-2 border-t border-[#F2DFE8] pt-4">
      {subtasks.map((subtask) => {
        const done = subtask.status === 'completed';
        return (
          <li key={subtask.id}>
            <button
              type="button"
              onClick={() => onToggle(subtask.id, !done)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#FFF5F8]"
            >
              {done ? (
                <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
              ) : (
                <Circle size={18} className="shrink-0 text-[#D4A8BC]" />
              )}
              <span className={`text-sm ${done ? 'text-[#9A5776] line-through' : 'text-[#5D2B44]'}`}>
                {subtask.title}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
