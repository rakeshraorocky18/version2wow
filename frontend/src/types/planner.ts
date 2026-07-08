export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriorityLevel = 'high' | 'medium' | 'low';
export type TaskFilter = 'all' | 'pending' | 'completed';
export type TaskSort = 'dueDate' | 'priority' | 'recent';

export type PlannerCategory =
  | 'Venue'
  | 'Photography'
  | 'Catering'
  | 'Shopping'
  | 'Documentation'
  | 'Other';

export interface WeddingPlan {
  id: string;
  partnerName: string;
  weddingDate: string;
  totalBudget?: number;
  createdAt?: string;
}

export interface WeddingTask {
  id: string;
  planId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  category?: string;
  dueDate?: string;
  priority?: number;
  priorityLevel?: TaskPriorityLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlannerActivity {
  id: string;
  planId: string;
  taskId?: string;
  taskTitle: string;
  action: 'added' | 'completed' | 'updated';
  details?: string;
  createdAt: string;
}

export interface PlannerProgress {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

export interface PlannerTimeline {
  plan: WeddingPlan;
  tasks: WeddingTask[];
  activities: PlannerActivity[];
  progress: PlannerProgress;
  daysRemaining: number;
}

export type TimelineBucket =
  | '12 Months Before'
  | '6 Months Before'
  | '3 Months Before'
  | '1 Month Before'
  | '1 Week Before'
  | 'Wedding Day';

export type DueDateStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';

export interface PlannerTaskWithSubtasks extends WeddingTask {
  subtasks: WeddingTask[];
}

export interface CreatePlanInput {
  partnerName: string;
  weddingDate: string;
  totalBudget?: number;
}

export const PLANNER_CATEGORIES: PlannerCategory[] = [
  'Venue',
  'Photography',
  'Catering',
  'Shopping',
  'Documentation',
  'Other',
];

export const TIMELINE_BUCKETS: TimelineBucket[] = [
  '12 Months Before',
  '6 Months Before',
  '3 Months Before',
  '1 Month Before',
  '1 Week Before',
  'Wedding Day',
];
