import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PlannerDashboard from '../components/planner/PlannerDashboard';
import PlannerStatsCards from '../components/planner/PlannerStatsCards';
import PlannerProgressCard from '../components/planner/PlannerProgressCard';
import PlannerSearchBar from '../components/planner/PlannerSearchBar';
import PlannerFilters from '../components/planner/PlannerFilters';
import PlannerTaskCard from '../components/planner/PlannerTaskCard';
import PlannerTimeline from '../components/planner/PlannerTimeline';
import PlannerRecentActivity from '../components/planner/PlannerRecentActivity';
import PlannerEmptyState from '../components/planner/PlannerEmptyState';
import PlannerCelebration from '../components/planner/PlannerCelebration';
import PlannerSkeleton from '../components/planner/PlannerSkeleton';
import { usePlannerMutations, usePlannerPlans, usePlannerTimeline } from '../hooks/usePlanner';
import { buildTaskTree, filterAndSortTasks } from '../lib/plannerUtils';
import type { TaskFilter, TaskSort } from '../types/planner';

export default function Planner() {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('dueDate');
  const [newPlan, setNewPlan] = useState({ partnerName: '', weddingDate: '', totalBudget: '' });

  const { data: plans = [], isLoading: plansLoading } = usePlannerPlans();
  const activePlanId = selectedPlanId || plans[0]?.id || '';
  const { data: timeline, isLoading: timelineLoading } = usePlannerTimeline(activePlanId);
  const { createPlan, updateTaskStatus } = usePlannerMutations(activePlanId);

  const taskTree = useMemo(
    () => buildTaskTree(timeline?.tasks || []),
    [timeline?.tasks],
  );

  const filteredTasks = useMemo(
    () => filterAndSortTasks(taskTree, search, filter, sort),
    [taskTree, search, filter, sort],
  );

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
          setNewPlan({ partnerName: '', weddingDate: '', totalBudget: '' });
        },
      },
    );
  };

  const handleToggle = (taskId: string, completed: boolean) => {
    updateTaskStatus.mutate({ taskId, status: completed ? 'completed' : 'pending' });
  };

  const createForm = (
    <div className="grid gap-3 sm:grid-cols-3">
      <input
        type="text"
        value={newPlan.partnerName}
        onChange={(e) => setNewPlan({ ...newPlan, partnerName: e.target.value })}
        className="rounded-xl border border-[#E5C8D5] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B66A8A] focus:ring-2 focus:ring-[#F4D8E4]"
        placeholder="Partner's name"
      />
      <input
        type="date"
        value={newPlan.weddingDate}
        onChange={(e) => setNewPlan({ ...newPlan, weddingDate: e.target.value })}
        className="rounded-xl border border-[#E5C8D5] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B66A8A] focus:ring-2 focus:ring-[#F4D8E4]"
      />
      <input
        type="number"
        value={newPlan.totalBudget}
        onChange={(e) => setNewPlan({ ...newPlan, totalBudget: e.target.value })}
        className="rounded-xl border border-[#E5C8D5] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B66A8A] focus:ring-2 focus:ring-[#F4D8E4]"
        placeholder="Budget (optional)"
      />
      <div className="flex gap-2 sm:col-span-3">
        <button
          type="button"
          onClick={handleCreatePlan}
          disabled={createPlan.isPending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#B66A8A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A75878] disabled:opacity-60 sm:flex-none sm:px-6"
        >
          <Plus size={16} />
          {createPlan.isPending ? 'Creating...' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={() => setShowCreatePlan(false)}
          className="rounded-xl border border-[#E5C8D5] bg-white px-4 py-2.5 text-sm font-medium text-[#815A6D] hover:bg-[#FFF5F8]"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (plansLoading) {
    return (
      <div className="mx-auto max-w-6xl px-1 py-2">
        <PlannerSkeleton />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-1 py-2">
        <PlannerEmptyState
          variant="no-plans"
          action={
            showCreatePlan ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-[#F2DFE8] bg-white p-6 text-left shadow-sm">
                <h2 className="mb-4 font-display text-lg font-semibold text-[#5D2B44]">Create Wedding Plan</h2>
                {createForm}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreatePlan(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#B66A8A] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#A75878]"
              >
                <Plus size={16} />
                Create Wedding Plan
              </button>
            )
          }
        />
      </div>
    );
  }

  if (timelineLoading || !timeline) {
    return (
      <div className="mx-auto max-w-6xl px-1 py-2">
        <PlannerSkeleton />
      </div>
    );
  }

  const allComplete = timeline.progress.total > 0 && timeline.progress.percentage === 100;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-1 py-2">
      <PlannerDashboard
        plans={plans}
        activePlanId={activePlanId}
        partnerName={timeline.plan.partnerName}
        weddingDate={timeline.plan.weddingDate}
        daysRemaining={timeline.daysRemaining}
        showCreatePlan={showCreatePlan}
        onToggleCreatePlan={() => setShowCreatePlan((v) => !v)}
        onSelectPlan={setSelectedPlanId}
        createForm={createForm}
      />

      <PlannerStatsCards
        weddingDate={timeline.plan.weddingDate}
        daysRemaining={timeline.daysRemaining}
        progress={timeline.progress}
      />

      {allComplete && <PlannerCelebration show={allComplete} />}

      <PlannerProgressCard progress={timeline.progress} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#F2DFE8] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Task List</h2>
                <p className="text-xs text-[#9A5776]">Search, filter, and manage your wedding checklist</p>
              </div>
              <PlannerSearchBar value={search} onChange={setSearch} />
              <PlannerFilters filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
            </div>

            {taskTree.length === 0 ? (
              <PlannerEmptyState variant="no-tasks" />
            ) : filteredTasks.length === 0 ? (
              <PlannerEmptyState variant="no-results" />
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <PlannerTaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onToggleSubtask={handleToggle}
                  />
                ))}
              </div>
            )}
          </section>

          {!search && filter === 'all' && filteredTasks.length > 0 && (
            <PlannerTimeline
              tasks={filteredTasks}
              weddingDate={timeline.plan.weddingDate}
              onToggleTask={handleToggle}
            />
          )}
        </div>

        <PlannerRecentActivity activities={timeline.activities || []} />
      </div>
    </div>
  );
}
