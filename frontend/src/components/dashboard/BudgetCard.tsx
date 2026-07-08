import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import DashboardCard from './DashboardCard';

export interface BudgetCategory {
  name: string;
  spent: number;
  allocated: number;
  color: string;
}

interface BudgetCardProps {
  totalBudget?: number;
  spent?: number;
  remaining?: number;
  categories?: BudgetCategory[];
  compact?: boolean;
  className?: string;
}

function formatCurrencyFull(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact label for narrow summary boxes — e.g. ₹25L, ₹8L */
function formatCurrencyCompact(amount: number) {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${Math.round(amount / 1000)}K`;
  }
  return formatCurrencyFull(amount);
}

const CATEGORY_COLORS = [
  'bg-[#f4196d]',
  'bg-[#ff90b5]',
  'bg-[#535a60]',
  'bg-[#f4c95d]',
  'bg-[#10b981]',
];

export default function BudgetCard({
  totalBudget = 0,
  spent = 0,
  remaining = 0,
  categories = [],
  compact = false,
  className = '',
}: BudgetCardProps) {
  const spentPercent =
    totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  const summaryItems = [
    { label: 'Total', value: totalBudget, color: 'text-[#242729]' },
    { label: 'Spent', value: spent, color: 'text-[#f4196d]' },
    { label: 'Remaining', value: remaining, color: 'text-[#10b981]' },
  ];

  return (
    <DashboardCard className={className} delay={4}>
      <div className="dp-dash-panel-body">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="dp-dash-stat-card__icon !h-9 !w-9 shrink-0">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="dp-dash-section-title !mb-0 !text-base">Budget Overview</h2>
              {!compact && (
                <p className="text-[10px] text-[#6a737c]">Track your wedding expenses</p>
              )}
            </div>
          </div>
          <Link to="/app/finance" className="dp-dash-link shrink-0 !text-[11px]">
            Manage →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="min-w-0 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.04)] bg-[#f7f8fa] px-2 py-2.5 text-center"
            >
              <p className="truncate text-[9px] font-semibold text-[#6a737c] sm:text-[10px]">
                {item.label}
              </p>
              <p
                className={`mt-0.5 truncate text-sm font-extrabold leading-tight ${item.color}`}
                title={formatCurrencyFull(item.value)}
              >
                {formatCurrencyCompact(item.value)}
              </p>
              <p className="mt-0.5 hidden truncate text-[9px] text-[#9fa6ad] sm:block">
                {formatCurrencyFull(item.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="font-bold text-[#242729]">Overall Progress</span>
            <span className="font-extrabold text-[#f4196d]">{spentPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#ebebeb]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#f4196d] to-[#ff90b5]"
              initial={{ width: 0 }}
              whileInView={{ width: `${spentPercent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {!compact && (
          <div className="mt-4 space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6a737c]">
              Category Breakdown
            </p>
            {categories.map((cat, i) => {
              const pct = cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : 0;
              const barColor = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={cat.name}>
                  <div className="mb-1 flex items-start justify-between gap-2 text-[10px] sm:text-[11px]">
                    <span className="shrink-0 font-semibold text-[#242729]">{cat.name}</span>
                    <span className="min-w-0 text-right leading-tight text-[#6a737c]">
                      <span className="block sm:inline">
                        {formatCurrencyCompact(cat.spent)}
                      </span>
                      <span className="hidden text-[#9fa6ad] sm:inline">
                        {' '}
                        / {formatCurrencyFull(cat.allocated)}
                      </span>
                      <span className="block text-[9px] text-[#9fa6ad] sm:hidden">
                        of {formatCurrencyCompact(cat.allocated)}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#ebebeb]">
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(pct, 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
