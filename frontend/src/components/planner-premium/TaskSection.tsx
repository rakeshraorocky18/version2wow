import { motion } from 'framer-motion';
import { Check, GripVertical, Calendar } from 'lucide-react';
import GlassCard from './GlassCard';
import type { PlannerTaskItem } from '../../types/plannerDashboard';

interface TaskSectionProps {
  tasks: PlannerTaskItem[];
  onToggle?: (taskId: string, completed: boolean) => void;
}

function priorityClass(priority: string) {
  if (priority === 'high') return 'wow-priority-high';
  if (priority === 'low') return 'wow-priority-low';
  return 'wow-priority-medium';
}

export default function TaskSection({ tasks, onToggle }: TaskSectionProps) {
  return (
    <section aria-label="Task management">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Task Management
      </h2>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <GlassCard hover={false}>
            <p className="text-center text-sm text-gray-500">No tasks yet. Start planning your dream wedding!</p>
          </GlassCard>
        ) : (
          tasks.map((task, i) => {
            const isDone = task.status === 'completed';
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className={`wow-glass-card flex cursor-grab items-center gap-4 p-4 active:cursor-grabbing ${
                  isDone ? 'opacity-75' : ''
                }`}
              >
                <GripVertical size={16} className="shrink-0 text-gray-300" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => onToggle?.(task.id, !isDone)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    isDone
                      ? 'border-emerald-400 bg-emerald-400 text-white wow-check-animate'
                      : 'border-romantic-blush hover:border-romantic-rose'
                  }`}
                  aria-label={isDone ? `Mark ${task.title} as pending` : `Mark ${task.title} as complete`}
                >
                  {isDone && <Check size={14} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-romantic-cream'}`}>
                    {isDone ? '✓' : '⏳'} {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${priorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
