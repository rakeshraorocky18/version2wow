import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  PlannerDashboardData,
  PlannerBudget,
  PlannerCountdown,
  VendorRecommendations,
  PlannerGuests,
  PlannerRsvp,
  PlannerNotification,
  PlannerActivityItem,
  InspirationTheme,
} from '../types/plannerDashboard';
import type { PlannerTaskItem, SmartTask } from '../types/plannerDashboard';

export function usePlannerDashboard(planId?: string) {
  return useQuery<PlannerDashboardData>({
    queryKey: ['planner-dashboard', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get<PlannerDashboardData>(`/planner${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlannerDashboardTasks(planId?: string) {
  return useQuery<{ tasks: PlannerTaskItem[]; smartTasks: SmartTask[] }>({
    queryKey: ['planner-dashboard-tasks', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get(`/planner/tasks${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlannerBudget(planId?: string) {
  return useQuery<PlannerBudget>({
    queryKey: ['planner-budget', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get(`/planner/budget${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlannerCountdown(planId?: string) {
  return useQuery<PlannerCountdown>({
    queryKey: ['planner-countdown', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get(`/planner/countdown${params}`);
      return data;
    },
    refetchInterval: 1000,
    staleTime: 0,
  });
}

export function usePlannerVendors(planId?: string) {
  return useQuery<VendorRecommendations>({
    queryKey: ['planner-vendors', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get(`/planner/vendors${params}`);
      return data;
    },
    staleTime: 60_000,
  });
}

export function usePlannerGuests() {
  return useQuery<PlannerGuests>({
    queryKey: ['planner-guests'],
    queryFn: async () => {
      const { data } = await api.get('/planner/guests');
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlannerRsvp() {
  return useQuery<PlannerRsvp>({
    queryKey: ['planner-rsvp'],
    queryFn: async () => {
      const { data } = await api.get('/planner/rsvp');
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlannerNotifications(planId?: string) {
  return useQuery<PlannerNotification[]>({
    queryKey: ['planner-notifications', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get(`/planner/notifications${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlannerActivity(planId?: string) {
  return useQuery<PlannerActivityItem[]>({
    queryKey: ['planner-activity', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : '';
      const { data } = await api.get(`/planner/activity${params}`);
      return data;
    },
    staleTime: 15_000,
  });
}

export function usePlannerInspiration() {
  return useQuery<InspirationTheme[]>({
    queryKey: ['planner-inspiration'],
    queryFn: async () => {
      const { data } = await api.get('/planner/inspiration');
      return data;
    },
    staleTime: 300_000,
  });
}
