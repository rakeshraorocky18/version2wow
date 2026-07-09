export interface PlannerBudget {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  budgetPercentage: number;
  overBudget: boolean;
  categories: {
    venueBudget: number;
    photoBudget: number;
    decorationBudget: number;
    cateringBudget: number;
    miscBudget: number;
  };
  utilization: Record<string, { allocated: number; spent: number; percentage: number; overspent: boolean }>;
}

export interface PlannerGuests {
  guestCount: number;
  totalInvited: number;
  confirmedGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
}

export interface PlannerMilestone {
  id: string;
  label: string;
  status: 'completed' | 'pending' | 'future';
}

export interface SmartTask {
  title: string;
  priority: string;
  dueInDays?: number;
  dueDate: string;
}

export interface PlannerTaskItem {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  status: string;
  category?: string;
}

export interface PlannerNotification {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  actionPath: string;
}

export interface PlannerActivityItem {
  id: string;
  type: string;
  text: string;
  timestamp: string;
  icon: string;
}

export interface VendorRecommendation {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  availability: string;
  image: string;
  location?: string;
}

export interface InspirationTheme {
  id: string;
  title: string;
  image: string;
}

export interface PlannerCountdown {
  daysRemaining: number;
  weddingDate: string | null;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface PlannerRsvp extends PlannerGuests {
  acceptedPercentage: number;
  declinedPercentage: number;
  pendingPercentage: number;
}

export interface PlannerDashboardData {
  hasPlan: boolean;
  userName?: string;
  partnerName?: string;
  weddingDate?: string;
  venue?: string;
  theme?: string;
  daysRemaining?: number;
  compatibilityPercentage?: number;
  progress?: { total: number; completed: number; pending: number; percentage: number };
  budget?: PlannerBudget;
  guests?: PlannerGuests;
  upcomingEventsCount?: number;
  quote?: string;
  milestones?: PlannerMilestone[];
  smartTasks?: SmartTask[];
  planId?: string;
  inspiration?: InspirationTheme[];
}

export type VendorRecommendations = Record<string, VendorRecommendation[]>;
