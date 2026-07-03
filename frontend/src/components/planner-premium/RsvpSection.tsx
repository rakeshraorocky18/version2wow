import GlassCard from './GlassCard';
import DonutChart from './DonutChart';
import AnimatedNumber from '../dashboard/AnimatedNumber';
import type { PlannerRsvp } from '../../types/plannerDashboard';

interface RsvpSectionProps {
  rsvp: PlannerRsvp;
}

export default function RsvpSection({ rsvp }: RsvpSectionProps) {
  const stats = [
    { label: 'Total Invited', value: rsvp.totalInvited, color: 'text-gray-700 dark:text-romantic-cream' },
    { label: 'Accepted', value: rsvp.confirmedGuests, color: 'text-emerald-600' },
    { label: 'Declined', value: rsvp.declinedGuests, color: 'text-red-500' },
    { label: 'Pending', value: rsvp.pendingGuests, color: 'text-amber-600' },
  ];

  return (
    <section aria-label="RSVP dashboard">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        RSVP Dashboard
      </h2>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GlassCard className="flex flex-col items-center">
          <DonutChart percentage={rsvp.acceptedPercentage} size={140} label="Accepted" />
        </GlassCard>
        <GlassCard hover={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/50 p-4 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                <p className={`mt-1 font-display text-2xl font-bold ${s.color}`}>
                  <AnimatedNumber value={s.value} />
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {[
              { label: 'Accepted', pct: rsvp.acceptedPercentage, color: '#10b981' },
              { label: 'Declined', pct: rsvp.declinedPercentage, color: '#ef4444' },
              { label: 'Pending', pct: rsvp.pendingPercentage, color: '#f59e0b' },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{bar.label}</span>
                  <span>{bar.pct}%</span>
                </div>
                <div className="wow-progress-bar">
                  <div className="wow-progress-fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
