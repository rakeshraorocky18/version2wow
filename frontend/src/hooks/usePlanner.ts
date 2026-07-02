import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { CreatePlanInput, PlannerTimeline, TaskStatus, WeddingPlan } from '../types/planner';

export function usePlannerPlans() {
  return useQuery<WeddingPlan[]>({
    queryKey: ['planner-plans'],
    queryFn: async () => {
      const { data } = await api.get<WeddingPlan[]>('/planner/plans');
      return data;
    },
  });
}

export function usePlannerTimeline(planId: string) {
  return useQuery<PlannerTimeline | null>({
    queryKey: ['planner-timeline', planId],
    enabled: Boolean(planId),
    queryFn: async () => {
      const { data } = await api.get<PlannerTimeline>(`/planner/timeline?planId=${planId}`);
      return data;
    },
  });
}

export function usePlannerMutations(planId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['planner-timeline', planId] });
    queryClient.invalidateQueries({ queryKey: ['planner-plans'] });
  };

  const createPlan = useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      const { data } = await api.post<WeddingPlan>('/planner/plan', input);
      return data;
    },
    onSuccess: () => {
      toast.success('Wedding plan created!');
      queryClient.invalidateQueries({ queryKey: ['planner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['planner-timeline'] });
    },
    onError: () => toast.error('Failed to create plan'),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      await api.put(`/planner/tasks/${taskId}/status`, { status });
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to update task'),
  });

  const createTask = useMutation({
    mutationFn: async (payload: {
      title: string;
      category?: string;
      dueDate?: string;
      priorityLevel?: string;
    }) => {
      const { data } = await api.post(`/planner/plan/${planId}/tasks`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Task added');
      invalidate();
    },
    onError: () => toast.error('Failed to add task'),
  });

  const createSubtask = useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const { data } = await api.post(`/planner/tasks/${taskId}/subtasks`, { title });
      return data;
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to add subtask'),
  });

  return { createPlan, updateTaskStatus, createTask, createSubtask, invalidate };
}
