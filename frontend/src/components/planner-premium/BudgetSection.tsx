import { AlertTriangle } from 'lucide-react';
import GlassCard from './GlassCard';
import DonutChart from './DonutChart';
import AnimatedNumber from '../dashboard/AnimatedNumber';
import type { PlannerBudget } from '../../types/plannerDashboard';

interface BudgetSectionProps {
  budget: PlannerBudget;
}

const CATEGORY_LABELS: { key: keyof PlannerBudget['categories']; label: string; color: string }[] = [
  { key: 'venueBudget', label: 'Venue', color: '#FF5C8D' },
  { key: 'photoBudget', label: 'Photography', color: '#C8A2C8' },
  { key: 'decorationBudget', label: 'Decoration', color: '#D4AF37' },
  { key: 'cateringBudget', label: 'Catering', color: '#FFB6C1' },
  { key: 'miscBudget', label: 'Miscellaneous', color: '#FFDAB9' },
];

export default function BudgetSection({ budget }: BudgetSectionProps) {
  const totalAllocated = Object.values(budget.categories).reduce((s, v) => s + v, 0) || 1;

  return (
    <section aria-label="Budget dashboard">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Budget Dashboard
      </h2>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GlassCard className="flex flex-col items-center justify-center">
          <DonutChart
            percentage={budget.budgetPercentage}
            size={160}
            label="Used"
            sublabel={`₹${budget.spentAmount.toLocaleString('en-IN')} of ₹${budget.totalBudget.toLocaleString('en-IN')}`}
          />
          {budget.overBudget && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle size={16} />
              Overspending detected
            </div>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <div className="space-y-5">
            {CATEGORY_LABELS.map((cat) => {
              const amount = budget.categories[cat.key];
              const pct = Math.round((amount / totalAllocated) * 100);
              const util = budget.utilization[cat.label] || budget.utilization[cat.key.replace('Budget', '')];
              const spentPct = util?.percentage ?? Math.min(pct, 100);

              return (
                <div key={cat.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-romantic-cream">
                      {cat.label} Budget: ₹<AnimatedNumber value={amount} />
                    </span>
                    <span className="text-xs text-gray-500">{spentPct}% utilized</span>
                  </div>
                  <div className="wow-progress-bar">
                    <div
                      className="wow-progress-fill"
                      style={{
                        width: `${spentPct}%`,
                        background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                      }}
                    />
                  </div>
                  {util?.overspent && (
                    <p className="mt-1 text-xs text-red-500">⚠️ Over budget for this category</p>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
