import { CalendarHeart, Heart, Plus, Sparkles } from 'lucide-react';
import type { WeddingPlan } from '../../types/planner';
import { formatWeddingDate, getDaysRemainingLabel } from '../../lib/plannerUtils';

interface PlannerDashboardProps {
  plans: WeddingPlan[];
  activePlanId: string;
  partnerName: string;
  weddingDate: string;
  daysRemaining: number;
  showCreatePlan: boolean;
  onToggleCreatePlan: () => void;
  onSelectPlan: (planId: string) => void;
  createForm: React.ReactNode;
}

export default function PlannerDashboard({
  plans,
  activePlanId,
  partnerName,
  weddingDate,
  daysRemaining,
  showCreatePlan,
  onToggleCreatePlan,
  onSelectPlan,
  createForm,
}: PlannerDashboardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-white shadow-[0_12px_40px_rgba(174,94,129,0.1)]">
      <div className="relative bg-gradient-to-r from-[#E8A4BC] via-[#C99BD4] to-[#A8B8E8] px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles size={12} />
              Wedding Planner
            </div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {partnerName ? `Planning with ${partnerName}` : 'Wedding Planner'}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
              <CalendarHeart size={16} />
              {formatWeddingDate(weddingDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/95 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5776]">Days Remaining</p>
              <p className="font-display text-2xl font-bold text-[#5D2B44]">{Math.max(daysRemaining, 0)}</p>
              <p className="text-xs text-[#815A6D]">{getDaysRemainingLabel(daysRemaining)}</p>
            </div>
            <button
              type="button"
              onClick={onToggleCreatePlan}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#5D2B44] shadow-md transition hover:bg-[#FFF5F8]"
            >
              <Plus size={16} />
              New Plan
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[#F2DFE8] px-6 py-4 sm:px-8">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#9A5776]">
          Select Existing Plan
        </label>
        <select
          value={activePlanId}
          onChange={(e) => onSelectPlan(e.target.value)}
          className="w-full rounded-xl border border-[#E5C8D5] bg-[#FFFBFC] px-4 py-2.5 text-sm text-[#5D2B44] outline-none transition focus:border-[#B66A8A] focus:ring-2 focus:ring-[#F4D8E4] sm:max-w-md"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {formatWeddingDate(plan.weddingDate)} — {plan.partnerName}
            </option>
          ))}
        </select>
      </div>

      {showCreatePlan && (
        <div className="border-b border-[#F2DFE8] bg-[#FFFBFC] px-6 py-5 sm:px-8">
          <div className="mb-3 flex items-center gap-2">
            <Heart size={16} className="text-[#B66A8A]" />
            <h2 className="font-display text-base font-semibold text-[#5D2B44]">Create Wedding Plan</h2>
          </div>
          {createForm}
        </div>
      )}
    </div>
  );
}
