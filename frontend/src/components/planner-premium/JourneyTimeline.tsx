import { Check, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import type { PlannerMilestone } from '../../types/plannerDashboard';

interface JourneyTimelineProps {
  milestones: PlannerMilestone[];
}

export default function JourneyTimeline({ milestones }: JourneyTimelineProps) {
  return (
    <section aria-label="Wedding journey timeline">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Wedding Journey Timeline
      </h2>
      <GlassCard hover={false}>
        <div className="relative space-y-0">
          {milestones.map((milestone, i) => {
            const isCompleted = milestone.status === 'completed';
            const isFuture = milestone.status === 'future';
            const isLast = i === milestones.length - 1;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                {!isLast && (
                  <div
                    className={`absolute left-5 top-10 h-full w-0.5 ${
                      isCompleted ? 'bg-gradient-to-b from-emerald-400 to-emerald-300' : 'bg-romantic-blush/40'
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isCompleted
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : isFuture
                        ? 'border-2 border-dashed border-romantic-lavender/60 bg-romantic-cream/50 text-romantic-lavender wow-pulse-glow'
                        : 'bg-gradient-to-br from-romantic-blush to-romantic-lavender text-white'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} className="wow-check-animate" />
                  ) : isFuture ? (
                    <Sparkles size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>

                <div className="flex-1 pt-1.5">
                  <p
                    className={`font-medium ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isFuture
                          ? 'text-romantic-lavender dark:text-romantic-blush'
                          : 'text-gray-700 dark:text-romantic-cream'
                    }`}
                  >
                    {isCompleted ? '✓' : isFuture ? '◇' : '⏳'} {milestone.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isCompleted ? 'Completed' : isFuture ? 'Upcoming' : 'In progress'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </section>
  );
}
