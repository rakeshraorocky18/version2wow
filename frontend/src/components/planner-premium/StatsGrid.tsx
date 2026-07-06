import GlassCard from './GlassCard';
import AnimatedNumber from '../dashboard/AnimatedNumber';
import type { PlannerBudget, PlannerGuests } from '../../types/plannerDashboard';

interface StatsGridProps {
  compatibilityPercentage: number;
  daysRemaining: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  budget: PlannerBudget;
  guests: PlannerGuests;
  upcomingEventsCount: number;
}

const STAT_GRADIENTS = [
  'from-romantic-blush/40 to-romantic-rose/30',
  'from-romantic-rose/30 to-romantic-lavender/30',
  'from-romantic-lavender/30 to-romantic-peach/30',
  'from-romantic-champagne/30 to-romantic-peach/30',
  'from-romantic-blush/30 to-romantic-lavender/30',
  'from-romantic-rose/20 to-romantic-champagne/30',
];

function formatCurrency(n: number) {
  return n.toLocaleString('en-IN');
}

export default function StatsGrid({
  compatibilityPercentage,
  daysRemaining,
  completedTasks,
  totalTasks,
  progressPercentage,
  budget,
  guests,
  upcomingEventsCount,
}: StatsGridProps) {
  const cards = [
    {
      emoji: '❤️',
      title: 'Compatibility Score',
      content: (
        <p className="font-display text-3xl font-bold text-romantic-rose dark:text-romantic-blush">
          <AnimatedNumber value={compatibilityPercentage} suffix="%" />
        </p>
      ),
    },
    {
      emoji: '💍',
      title: 'Wedding Countdown',
      content: (
        <p className="font-display text-3xl font-bold text-romantic-rose dark:text-romantic-blush">
          <AnimatedNumber value={Math.max(daysRemaining, 0)} />{' '}
          <span className="text-lg font-medium">Days Left</span>
        </p>
      ),
    },
    {
      emoji: '📋',
      title: 'Planning Progress',
      content: (
        <>
          <p className="font-display text-2xl font-bold text-romantic-rose dark:text-romantic-blush">
            <AnimatedNumber value={completedTasks} />/{totalTasks}
          </p>
          <p className="mt-1 text-sm font-semibold text-romantic-lavender">
            <AnimatedNumber value={progressPercentage} suffix="%" />
          </p>
        </>
      ),
    },
    {
      emoji: '💰',
      title: 'Budget Tracker',
      content: (
        <div className="space-y-1 text-sm">
          <p>
            Budget: <span className="font-semibold">₹{formatCurrency(budget.totalBudget)}</span>
          </p>
          <p>
            Spent: <span className="font-semibold text-romantic-rose">₹{formatCurrency(budget.spentAmount)}</span>
          </p>
          <p>
            Remaining:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(budget.remainingAmount)}
            </span>
          </p>
        </div>
      ),
    },
    {
      emoji: '👥',
      title: 'Guest Management',
      content: (
        <div className="space-y-1 text-sm">
          <p>
            Invited: <span className="font-semibold">{guests.totalInvited}</span>
          </p>
          <p>
            Confirmed: <span className="font-semibold text-emerald-600">{guests.confirmedGuests}</span>
          </p>
          <p>
            Pending: <span className="font-semibold text-amber-600">{guests.pendingGuests}</span>
          </p>
        </div>
      ),
    },
    {
      emoji: '🎉',
      title: 'Upcoming Events',
      content: (
        <p className="font-display text-3xl font-bold text-romantic-rose dark:text-romantic-blush">
          <AnimatedNumber value={upcomingEventsCount} />
        </p>
      ),
    },
  ];

  return (
    <section aria-label="Wedding statistics">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Your Wedding at a Glance
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => (
          <GlassCard key={card.title} delay={i * 0.05} className={`bg-gradient-to-br ${STAT_GRADIENTS[i]}`}>
            <div className="mb-2 text-2xl">{card.emoji}</div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {card.title}
            </p>
            {card.content}
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
