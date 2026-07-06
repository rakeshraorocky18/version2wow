import { Link } from 'react-router-dom';
import { Bell, AlertCircle, Info } from 'lucide-react';
import GlassCard from './GlassCard';
import type { PlannerNotification } from '../../types/plannerDashboard';

interface NotificationsPanelProps {
  notifications: PlannerNotification[];
}

function priorityIcon(priority: string) {
  if (priority === 'high') return <AlertCircle size={16} className="text-red-500" />;
  if (priority === 'medium') return <Bell size={16} className="text-amber-500" />;
  return <Info size={16} className="text-blue-400" />;
}

function priorityBorder(priority: string) {
  if (priority === 'high') return 'border-l-red-400';
  if (priority === 'medium') return 'border-l-amber-400';
  return 'border-l-blue-300';
}

export default function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <section aria-label="Notifications">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        <Bell size={22} className="text-romantic-rose" />
        Notifications
      </h2>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <GlassCard hover={false}>
            <p className="text-center text-sm text-gray-500">You&apos;re all caught up!</p>
          </GlassCard>
        ) : (
          notifications.map((n) => (
            <GlassCard key={n.id} delay={0} className={`border-l-4 ${priorityBorder(n.priority)}`}>
              <div className="flex items-start gap-3">
                {priorityIcon(n.priority)}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-romantic-cream">{n.message}</p>
                  <Link
                    to={n.actionPath}
                    className="mt-2 inline-block text-xs font-semibold text-romantic-rose hover:underline"
                  >
                    {n.action} →
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </section>
  );
}
