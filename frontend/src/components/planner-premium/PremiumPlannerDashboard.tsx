import { lazy, Suspense, useState } from 'react';
import { Moon, Sun, Plus } from 'lucide-react';
import { usePlannerMutations, usePlannerPlans } from '../../hooks/usePlanner';
import {
  usePlannerDashboard,
  usePlannerDashboardTasks,
  usePlannerBudget,
  usePlannerCountdown,
  usePlannerVendors,
  usePlannerRsvp,
  usePlannerNotifications,
  usePlannerActivity,
  usePlannerInspiration,
} from '../../hooks/usePlannerDashboard';
import { usePlannerSocket } from '../../hooks/usePlannerSocket';
import PremiumPlannerSkeleton from './PremiumPlannerSkeleton';
import PlannerEmptyState from '../planner/PlannerEmptyState';

const PlannerHero = lazy(() => import('./PlannerHero'));
const StatsGrid = lazy(() => import('./StatsGrid'));
const QuickActions = lazy(() => import('./QuickActions'));
const JourneyTimeline = lazy(() => import('./JourneyTimeline'));
const BudgetSection = lazy(() => import('./BudgetSection'));
const TaskSection = lazy(() => import('./TaskSection'));
const SmartRecommendations = lazy(() => import('./SmartRecommendations'));
const VendorRecommendationsSection = lazy(() => import('./VendorRecommendationsSection'));
const RsvpSection = lazy(() => import('./RsvpSection'));
const ActivityFeed = lazy(() => import('./ActivityFeed'));
const NotificationsPanel = lazy(() => import('./NotificationsPanel'));
const InspirationGallery = lazy(() => import('./InspirationGallery'));

export default function PremiumPlannerDashboard() {
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.classList.contains('dark'),
  );
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ partnerName: '', weddingDate: '', totalBudget: '', venue: '', theme: '' });

  const { data: plans = [], isLoading: plansLoading } = usePlannerPlans();
  const activePlanId = selectedPlanId || plans[0]?.id || '';

  const { data: dashboard, isLoading: dashLoading } = usePlannerDashboard(activePlanId);
  const { data: tasksData } = usePlannerDashboardTasks(activePlanId);
  const { data: budget } = usePlannerBudget(activePlanId);
  const { data: countdown } = usePlannerCountdown(activePlanId);
  const { data: vendors } = usePlannerVendors(activePlanId);
  const { data: rsvp } = usePlannerRsvp();
  const { data: notifications = [] } = usePlannerNotifications(activePlanId);
  const { data: activities = [] } = usePlannerActivity(activePlanId);
  const { data: inspiration = [] } = usePlannerInspiration();

  const { createPlan, updateTaskStatus } = usePlannerMutations(activePlanId);
  usePlannerSocket(activePlanId);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleCreatePlan = () => {
    if (!newPlan.partnerName.trim() || !newPlan.weddingDate) return;
    createPlan.mutate(
      {
        partnerName: newPlan.partnerName.trim(),
        weddingDate: newPlan.weddingDate,
        totalBudget: Number(newPlan.totalBudget) || undefined,
      },
      {
        onSuccess: (created) => {
          setSelectedPlanId(created.id);
          setShowCreatePlan(false);
          setNewPlan({ partnerName: '', weddingDate: '', totalBudget: '', venue: '', theme: '' });
        },
      },
    );
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTaskStatus.mutate({ taskId, status: completed ? 'completed' : 'pending' });
  };

  if (plansLoading || dashLoading) {
    return (
      <div className="wow-planner -mx-4 -my-2 px-4 py-6 sm:-mx-6 sm:px-6">
        <PremiumPlannerSkeleton />
      </div>
    );
  }

  if (plans.length === 0 || !dashboard?.hasPlan) {
    return (
      <div className="wow-planner -mx-4 -my-2 px-4 py-6 sm:-mx-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-gray-800 dark:text-romantic-cream">
            World of Weddings
          </h1>
          <button type="button" onClick={toggleDarkMode} className="rounded-full p-2 text-romantic-rose" aria-label="Toggle dark mode">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <PlannerEmptyState
          variant="no-plans"
          action={
            showCreatePlan ? (
              <div className="wow-glass-card mx-auto max-w-lg p-6 text-left">
                <h2 className="mb-4 font-display text-lg font-semibold">Create Your Wedding Plan</h2>
                <div className="grid gap-3">
                  <input
                    type="text"
                    placeholder="Partner's name"
                    value={newPlan.partnerName}
                    onChange={(e) => setNewPlan({ ...newPlan, partnerName: e.target.value })}
                    className="rounded-xl border border-romantic-blush/50 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-romantic-rose dark:bg-white/10 dark:text-romantic-cream"
                  />
                  <input
                    type="date"
                    value={newPlan.weddingDate}
                    onChange={(e) => setNewPlan({ ...newPlan, weddingDate: e.target.value })}
                    className="rounded-xl border border-romantic-blush/50 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-romantic-rose dark:bg-white/10 dark:text-romantic-cream"
                  />
                  <input
                    type="number"
                    placeholder="Budget (optional)"
                    value={newPlan.totalBudget}
                    onChange={(e) => setNewPlan({ ...newPlan, totalBudget: e.target.value })}
                    className="rounded-xl border border-romantic-blush/50 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-romantic-rose dark:bg-white/10 dark:text-romantic-cream"
                  />
                  <button type="button" onClick={handleCreatePlan} disabled={createPlan.isPending} className="wow-btn-romantic">
                    {createPlan.isPending ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCreatePlan(true)} className="wow-btn-romantic inline-flex items-center gap-2">
                <Plus size={16} />
                Begin Your Wedding Journey
              </button>
            )
          }
        />
        {inspiration.length > 0 && (
          <div className="mt-10">
            <Suspense fallback={<PremiumPlannerSkeleton />}>
              <InspirationGallery themes={inspiration} />
            </Suspense>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wow-planner -mx-4 -my-2 space-y-8 px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-romantic-rose">World of Weddings</p>
          {plans.length > 1 && (
            <select
              value={activePlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="mt-1 rounded-lg border border-romantic-blush/40 bg-white/60 px-3 py-1.5 text-sm dark:bg-white/10 dark:text-romantic-cream"
              aria-label="Select wedding plan"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partnerName} — {new Date(p.weddingDate).toLocaleDateString('en-IN')}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowCreatePlan((v) => !v)} className="wow-btn-outline text-xs">
            <Plus size={14} className="mr-1 inline" />
            New Plan
          </button>
          <button type="button" onClick={toggleDarkMode} className="rounded-full p-2.5 text-romantic-rose transition hover:bg-romantic-blush/20" aria-label="Toggle dark mode">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {showCreatePlan && (
        <div className="wow-glass-card p-5">
          <h2 className="mb-3 font-display font-semibold">Create Wedding Plan</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="text" placeholder="Partner's name" value={newPlan.partnerName} onChange={(e) => setNewPlan({ ...newPlan, partnerName: e.target.value })} className="rounded-xl border border-romantic-blush/50 px-4 py-2 text-sm dark:bg-white/10" />
            <input type="date" value={newPlan.weddingDate} onChange={(e) => setNewPlan({ ...newPlan, weddingDate: e.target.value })} className="rounded-xl border border-romantic-blush/50 px-4 py-2 text-sm dark:bg-white/10" />
            <input type="number" placeholder="Budget" value={newPlan.totalBudget} onChange={(e) => setNewPlan({ ...newPlan, totalBudget: e.target.value })} className="rounded-xl border border-romantic-blush/50 px-4 py-2 text-sm dark:bg-white/10" />
          </div>
          <button type="button" onClick={handleCreatePlan} className="wow-btn-romantic mt-3">Create</button>
        </div>
      )}

      <Suspense fallback={<PremiumPlannerSkeleton />}>
        <PlannerHero
          userName={dashboard.userName || 'Beautiful Soul'}
          partnerName={dashboard.partnerName || ''}
          weddingDate={dashboard.weddingDate || ''}
          venue={dashboard.venue || 'To be decided'}
          theme={dashboard.theme || 'Romantic Elegance'}
          daysRemaining={dashboard.daysRemaining || 0}
          progressPercentage={dashboard.progress?.percentage || 0}
          quote={dashboard.quote || ''}
          countdown={countdown}
        />

        <StatsGrid
          compatibilityPercentage={dashboard.compatibilityPercentage || 0}
          daysRemaining={dashboard.daysRemaining || 0}
          completedTasks={dashboard.progress?.completed || 0}
          totalTasks={dashboard.progress?.total || 0}
          progressPercentage={dashboard.progress?.percentage || 0}
          budget={
            budget ||
            dashboard.budget || {
              totalBudget: 0,
              spentAmount: 0,
              remainingAmount: 0,
              budgetPercentage: 0,
              overBudget: false,
              categories: { venueBudget: 0, photoBudget: 0, decorationBudget: 0, cateringBudget: 0, miscBudget: 0 },
              utilization: {},
            }
          }
          guests={
            dashboard.guests || {
              guestCount: 0,
              totalInvited: 0,
              confirmedGuests: 0,
              declinedGuests: 0,
              pendingGuests: 0,
              acceptedCount: 0,
              declinedCount: 0,
              pendingCount: 0,
            }
          }
          upcomingEventsCount={dashboard.upcomingEventsCount || 0}
        />

        <QuickActions />

        <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <JourneyTimeline milestones={dashboard.milestones || []} />
            {budget && <BudgetSection budget={budget} />}
            <TaskSection tasks={tasksData?.tasks || []} onToggle={handleToggleTask} />
            <SmartRecommendations tasks={tasksData?.smartTasks || dashboard.smartTasks || []} />
            {vendors && <VendorRecommendationsSection vendors={vendors} />}
            {rsvp && <RsvpSection rsvp={rsvp} />}
            <InspirationGallery themes={inspiration.length ? inspiration : dashboard.inspiration || []} />
          </div>
          <div className="space-y-8">
            <NotificationsPanel notifications={notifications} />
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
