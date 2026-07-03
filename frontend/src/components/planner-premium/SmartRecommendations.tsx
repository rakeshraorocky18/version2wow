import { Lightbulb, Calendar } from 'lucide-react';
import GlassCard from './GlassCard';
import type { SmartTask } from '../../types/plannerDashboard';

interface SmartRecommendationsProps {
  tasks: SmartTask[];
}

function priorityClass(priority: string) {
  if (priority === 'high') return 'wow-priority-high';
  if (priority === 'low') return 'wow-priority-low';
  return 'wow-priority-medium';
}

export default function SmartRecommendations({ tasks }: SmartRecommendationsProps) {
  return (
    <section aria-label="Smart task recommendations">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        <Lightbulb size={22} className="text-romantic-champagne" />
        Smart Task Recommendations
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {tasks.map((task, i) => (
          <GlassCard key={task.title} delay={i * 0.05}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800 dark:text-romantic-cream">{task.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={12} />
                  Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityClass(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
