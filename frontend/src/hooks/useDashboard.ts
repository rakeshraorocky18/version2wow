import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import {
  useReceivedInterests,
  useSentInterests,
  useAcceptedInterests,
  useMyMatchProfile,
  useShortlist,
} from './useMatchmaking';
import { usePlannerPlans } from './usePlanner';
import {
  apiProfileToForm,
  profileCompletion,
  getMissingBySection,
} from '../lib/profileEditValidation';
import { getMainProfilePhoto, getPhotoUrl } from '../lib/profileUtils';
import type { BudgetCategory } from '../components/dashboard/BudgetCard';
import type { PlannerTask } from '../components/dashboard/PlannerTimeline';
import type { VendorItem } from '../components/dashboard/VendorCarousel';
import type { ActivityItem } from '../components/dashboard/RecentActivity';
import type { WeddingMilestone } from '../components/dashboard/ProgressCard';
import type { PlannerTimeline as PlannerTimelineData } from '../types/planner';

interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  remaining: number;
}

interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
}

interface BudgetSummaryResponse {
  items: BudgetItem[];
  summary: BudgetSummary;
}

interface VendorSearchResult {
  _id: string;
  businessName: string;
  category: string;
  location?: { city?: string; state?: string };
  pricing?: { startingPrice?: number };
  rating?: { average: number };
}

interface VendorsSearchResponse {
  vendors: VendorSearchResult[];
  total: number;
}

interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  status?: string;
}

const CATEGORY_COLORS = [
  'bg-[#f4196d]',
  'bg-[#ff90b5]',
  'bg-[#535a60]',
  'bg-[#f4c95d]',
  'bg-[#10b981]',
];

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatWeddingDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function mapBudgetCategories(items: BudgetItem[]): BudgetCategory[] {
  const byCategory = new Map<string, { spent: number; allocated: number }>();

  for (const item of items) {
    const key = item.category || 'Other';
    const current = byCategory.get(key) ?? { spent: 0, allocated: 0 };
    byCategory.set(key, {
      spent: current.spent + (item.paidAmount || item.actualCost || 0),
      allocated: current.allocated + (item.estimatedCost || 0),
    });
  }

  return Array.from(byCategory.entries()).map(([name, vals], i) => ({
    name,
    spent: vals.spent,
    allocated: vals.allocated || vals.spent,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
}

function mapPlannerTasks(timeline: PlannerTimelineData | null | undefined): PlannerTask[] {
  if (!timeline?.tasks?.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const withDates = timeline.tasks
    .filter((t) => t.dueDate && t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  return withDates.slice(0, 4).map((task) => {
    const due = new Date(task.dueDate!);
    due.setHours(0, 0, 0, 0);
    const isTomorrow = due.getTime() === tomorrow.getTime();
    const timeLabel = new Date(task.dueDate!).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      time: timeLabel,
      title: task.title,
      ...(isTomorrow ? { day: 'Tomorrow' } : {}),
    };
  });
}

function mapVendors(vendors: VendorSearchResult[]): VendorItem[] {
  return vendors.slice(0, 4).map((v) => ({
    id: v._id,
    name: v.businessName,
    category: v.category,
    rating: v.rating?.average ?? 4.5,
    price: v.pricing?.startingPrice
      ? `From ₹${v.pricing.startingPrice.toLocaleString('en-IN')}`
      : 'View pricing',
    image: `https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop`,
    location: [v.location?.city, v.location?.state].filter(Boolean).join(', '),
  }));
}

export function useDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: myProfile } = useMyMatchProfile();
  const { data: receivedInterests = [] } = useReceivedInterests();
  const { data: sentInterests = [] } = useSentInterests();
  const { data: acceptedInterests = [] } = useAcceptedInterests();
  const { data: shortlistData } = useShortlist();
  const { data: plannerPlans = [] } = usePlannerPlans();

  const activePlan = plannerPlans[0] ?? null;
  const activePlanId = activePlan?.id ?? '';

  const { data: plannerTimeline } = useQuery<PlannerTimelineData | null>({
    queryKey: ['planner-timeline', activePlanId],
    enabled: Boolean(activePlanId),
    queryFn: async () => {
      const { data } = await api.get<PlannerTimelineData>(
        `/planner/timeline?planId=${activePlanId}`,
      );
      return data;
    },
  });

  const { data: budgetData } = useQuery<BudgetSummaryResponse | null>({
    queryKey: ['finance-budget'],
    queryFn: async () => {
      try {
        const { data } = await api.get<BudgetSummaryResponse>('/finance/budget');
        return data;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) return null;
        throw error;
      }
    },
  });

  const { data: vendorsData } = useQuery<VendorsSearchResponse>({
    queryKey: ['dashboard-vendors'],
    queryFn: async () => {
      const params = new URLSearchParams({ includeExternal: 'true', limit: '4' });
      const { data } = await api.get<VendorsSearchResponse>(`/vendors/search?${params}`);
      return data;
    },
  });

  const { data: events = [] } = useQuery<DashboardEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get<DashboardEvent[]>('/events');
      return data;
    },
  });

  const pendingRequests = receivedInterests.length;
  const sentPending = sentInterests.filter((m) => m.status === 'pending').length;
  const acceptedCount = acceptedInterests.length;
  const shortlistCount = shortlistData?.profiles?.length ?? 0;

  const userName =
    myProfile?.firstName || (user?.email ? user.email.split('@')[0] : 'there');

  const formSnapshot = myProfile ? apiProfileToForm(myProfile) : null;
  const completionPct = formSnapshot ? profileCompletion(formSnapshot) : 0;
  const missingSections = formSnapshot ? getMissingBySection(formSnapshot) : [];
  const mainPhoto = myProfile ? getMainProfilePhoto(myProfile) : '';
  const photoUrl = mainPhoto ? getPhotoUrl(mainPhoto) : '';

  const hasPreferences =
    completionPct >= 40 ||
    missingSections.every(
      (s) => s.section !== 'Personal Details' && s.section !== 'Location',
    );
  const hasMatchPreferences =
    completionPct >= 60 ||
    !missingSections.some((s) => s.section === 'Partner Preferences');

  const milestones: WeddingMilestone[] = useMemo(
    () => [
      { label: 'Profile Completed', done: completionPct >= 20 || Boolean(photoUrl) },
      { label: 'Preferences Added', done: hasPreferences },
      { label: 'Match Preferences Set', done: hasMatchPreferences },
      { label: 'Budget Added', done: Boolean(budgetData?.summary?.totalBudget) },
      { label: 'Venue Shortlisted', done: false },
      { label: 'Photographer', done: false },
      { label: 'Catering', done: false },
      { label: 'Invitations', done: false },
    ],
    [completionPct, photoUrl, hasPreferences, hasMatchPreferences, budgetData],
  );

  const completedMilestones = milestones.filter((m) => m.done).length;
  const planningPercent =
    plannerTimeline?.progress?.percentage ??
    Math.round((completedMilestones / milestones.length) * 100);

  const weddingDateStr = activePlan?.weddingDate ?? '';
  const daysLeft = weddingDateStr ? daysUntil(weddingDateStr) : 0;
  const weddingDateLabel = weddingDateStr
    ? formatWeddingDateLabel(weddingDateStr)
    : 'Set your wedding date';
  const weddingDateSubtitle = activePlan?.partnerName
    ? `Planning with ${activePlan.partnerName}`
    : 'Create a plan in Wedding Planner';

  const nextTask =
    missingSections.length > 0
      ? `Complete ${missingSections[0].section}`
      : pendingRequests > 0
        ? 'Review interest requests'
        : plannerTimeline?.tasks?.find((t) => t.status !== 'completed')?.title ??
          'Continue wedding planning';

  const budget = useMemo(() => {
    if (budgetData?.summary) {
      const { summary, items } = budgetData;
      return {
        total: summary.totalBudget,
        spent: summary.totalPaid || summary.totalActual,
        remaining: summary.remaining,
        categories: mapBudgetCategories(items),
      };
    }
    return {
      total: 0,
      spent: 0,
      remaining: 0,
      categories: [] as BudgetCategory[],
    };
  }, [budgetData]);

  const budgetSpentPercent =
    budget.total > 0 ? Math.round((budget.spent / budget.total) * 100) : 0;

  const upcomingEventsCount = useMemo(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return events.filter((e) => {
      const d = new Date(e.date);
      return d >= now && d <= monthEnd;
    }).length;
  }, [events]);

  const plannerTasks = mapPlannerTasks(plannerTimeline);
  const vendors = mapVendors(vendorsData?.vendors ?? []);

  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    if (pendingRequests > 0) {
      items.push({
        icon: null,
        text: `${pendingRequests} new interest${pendingRequests > 1 ? 's' : ''} received`,
        time: 'Just now',
        color: 'text-[#f4196d] bg-[#ffeef1]',
      });
    }
    if (acceptedCount > 0) {
      items.push({
        icon: null,
        text: 'Match Accepted',
        time: 'Active',
        color: 'text-[#10b981] bg-[#ecfdf5]',
      });
    }
    if (shortlistCount > 0) {
      items.push({
        icon: null,
        text: `${shortlistCount} profile${shortlistCount > 1 ? 's' : ''} shortlisted`,
        time: 'Saved',
        color: 'text-[#f4196d] bg-[#ffeef1]',
      });
    }
    if (sentPending > 0) {
      items.push({
        icon: null,
        text: `${sentPending} interest${sentPending > 1 ? 's' : ''} awaiting reply`,
        time: 'Pending',
        color: 'text-[#f4c95d] bg-[#fffcef]',
      });
    }

    for (const act of plannerTimeline?.activities?.slice(0, 3) ?? []) {
      items.push({
        icon: null,
        text: act.taskTitle,
        time: act.createdAt
          ? new Date(act.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            })
          : 'Recent',
        color: 'text-[#ff90b5] bg-[#fff5f8]',
      });
    }

    return items;
  }, [
    pendingRequests,
    acceptedCount,
    shortlistCount,
    sentPending,
    plannerTimeline?.activities,
  ]);

  return {
    userName,
    photoUrl,
    myProfile,
    completionPct,
    missingSections: missingSections.map((s) => s.section),
    hasPhoto: Boolean(photoUrl),
    planningPercent,
    daysLeft,
    weddingDateLabel,
    weddingDateSubtitle,
    nextTask,
    pendingRequests,
    acceptedCount,
    shortlistCount,
    sentPending,
    budget,
    budgetSpentPercent,
    upcomingEventsCount,
    savedVendorsCount: vendorsData?.total ?? 0,
    plannerTasks,
    vendors,
    activities,
    acceptedInterests,
  };
}
