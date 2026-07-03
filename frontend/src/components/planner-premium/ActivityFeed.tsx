import { motion } from 'framer-motion';
import {
  CheckCircle, Wallet, UserCheck, Mail, ListChecks, CreditCard, Activity,
} from 'lucide-react';
import GlassCard from './GlassCard';
import type { PlannerActivityItem } from '../../types/plannerDashboard';

const ICON_MAP: Record<string, typeof Activity> = {
  vendor_booked: CheckCircle,
  budget_updated: Wallet,
  rsvp_received: UserCheck,
  invitation_sent: Mail,
  task_completed: ListChecks,
  payment_completed: CreditCard,
  task_added: ListChecks,
  task_updated: Activity,
  activity: Activity,
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface ActivityFeedProps {
  activities: PlannerActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <section aria-label="Recent activity">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Recent Activity
      </h2>
      <GlassCard hover={false}>
        {activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No recent activity yet.</p>
        ) : (
          <div className="space-y-1">
            {activities.map((item, i) => {
              const Icon = ICON_MAP[item.type] || Activity;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-romantic-blush/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-romantic-blush/40 to-romantic-lavender/30 text-romantic-rose">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700 dark:text-romantic-cream">
                      {item.text}
                    </p>
                    <p className="text-xs text-gray-400">{formatTime(item.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </section>
  );
}
