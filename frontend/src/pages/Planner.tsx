import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle, Circle, Plus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface WeddingPlan {
  id: string;
  partnerName: string;
  weddingDate: string;
  totalBudget?: number;
}

interface WeddingTask {
  id: string;
  title: string;
  status: string;
  category?: string;
  dueDate?: string;
}

interface PlannerTimeline {
  plan: WeddingPlan;
  tasks: WeddingTask[];
  events: unknown[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export default function Planner() {
  const queryClient = useQueryClient();
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [newPlan, setNewPlan] = useState({ partnerName: '', weddingDate: '', totalBudget: '' });

  const { data: plans = [], isLoading: isPlansLoading } = useQuery<WeddingPlan[]>({
    queryKey: ['planner-plans'],
    queryFn: async () => {
      const { data } = await api.get<WeddingPlan[]>('/planner/plans');
      return data;
    },
  });

  const activePlanId = selectedPlanId || plans[0]?.id || '';

  const { data: timeline, isLoading: isTimelineLoading } = useQuery<PlannerTimeline | null>({
    queryKey: ['planner-timeline', activePlanId],
    enabled: Boolean(activePlanId),
    queryFn: async () => {
      const { data } = await api.get<PlannerTimeline>(`/planner/timeline?planId=${activePlanId}`);
      return data;
    },
  });

  const createPlan = useMutation({
    mutationFn: async () => {
      if (!newPlan.partnerName.trim() || !newPlan.weddingDate) {
        throw new Error('Partner name and wedding date are required');
      }

      const { data } = await api.post('/planner/plan', {
        partnerName: newPlan.partnerName.trim(),
        weddingDate: newPlan.weddingDate,
        totalBudget: Number(newPlan.totalBudget) || undefined,
      });
      return data;
    },
    onSuccess: (createdPlan: WeddingPlan) => {
      toast.success('Wedding plan created!');
      setSelectedPlanId(createdPlan.id);
      queryClient.invalidateQueries({ queryKey: ['planner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['planner-timeline'] });
      setShowCreatePlan(false);
      setNewPlan({ partnerName: '', weddingDate: '', totalBudget: '' });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create plan';
      toast.error(message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      await api.put(`/planner/tasks/${taskId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-timeline', activePlanId] });
    },
  });

  if (isPlansLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Wedding Planner</h1>

        {!showCreatePlan ? (
          <div className="card text-center py-12">
            <Calendar size={48} className="text-gray-300 mx-auto" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Start Planning Your Wedding</h2>
            <p className="mt-2 text-gray-500">Create your wedding plan to get an auto-generated timeline and tasks.</p>
            <button onClick={() => setShowCreatePlan(true)} className="btn-primary mt-6">
              <Plus size={18} className="inline mr-2" /> Create Wedding Plan
            </button>
          </div>
        ) : (
          <div className="card max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Wedding Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner's Name</label>
                <input
                  type="text"
                  value={newPlan.partnerName}
                  onChange={(e) => setNewPlan({ ...newPlan, partnerName: e.target.value })}
                  className="input-field"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date</label>
                <input
                  type="date"
                  value={newPlan.weddingDate}
                  onChange={(e) => setNewPlan({ ...newPlan, weddingDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
                <input
                  type="number"
                  value={newPlan.totalBudget}
                  onChange={(e) => setNewPlan({ ...newPlan, totalBudget: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 2000000"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => createPlan.mutate()} className="btn-primary flex-1">
                  {createPlan.isPending ? 'Creating...' : 'Create Plan'}
                </button>
                <button onClick={() => setShowCreatePlan(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isTimelineLoading || !timeline) {
    return <div className="text-center py-12 text-gray-500">Loading timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Wedding Planner</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreatePlan((prev) => !prev)} className="btn-secondary">
            <Plus size={16} className="inline mr-2" /> New Plan
          </button>
          <div className="text-sm text-gray-500">
            {timeline.progress.percentage}% complete
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-500">Partner: {timeline.plan.partnerName}</p>
          </div>
          <select
            value={activePlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {new Date(plan.weddingDate).toLocaleDateString()} - {plan.partnerName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showCreatePlan && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Another Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newPlan.partnerName}
              onChange={(e) => setNewPlan({ ...newPlan, partnerName: e.target.value })}
              className="input-field"
              placeholder="Partner name"
            />
            <input
              type="date"
              value={newPlan.weddingDate}
              onChange={(e) => setNewPlan({ ...newPlan, weddingDate: e.target.value })}
              className="input-field"
            />
            <input
              type="number"
              value={newPlan.totalBudget}
              onChange={(e) => setNewPlan({ ...newPlan, totalBudget: e.target.value })}
              className="input-field"
              placeholder="Budget"
            />
          </div>
          <div className="mt-3 flex gap-3">
            <button onClick={() => createPlan.mutate()} className="btn-primary">
              {createPlan.isPending ? 'Creating...' : 'Create Plan'}
            </button>
            <button onClick={() => setShowCreatePlan(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span>{timeline.progress.completed}/{timeline.progress.total} tasks</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${timeline.progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
        <div className="space-y-2">
          {timeline.tasks?.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group"
            >
              <button
                onClick={() =>
                  updateTask.mutate({
                    taskId: task.id,
                    status: task.status === 'completed' ? 'pending' : 'completed',
                  })
                }
              >
                {task.status === 'completed' ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
              </button>
              <div className="flex-1">
                <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                {task.category && (
                  <span className="text-xs text-gray-400">{task.category}</span>
                )}
              </div>
              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
