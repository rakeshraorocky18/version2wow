import type {
  DueDateStatus,
  PlannerTaskWithSubtasks,
  TaskFilter,
  TaskPriorityLevel,
  TaskSort,
  TimelineBucket,
  WeddingTask,
} from '../types/planner';
import { TIMELINE_BUCKETS } from '../types/planner';

export function getProgressColor(percentage: number): string {
  if (percentage <= 30) return 'from-red-500 to-rose-500';
  if (percentage <= 70) return 'from-amber-400 to-yellow-500';
  return 'from-emerald-500 to-green-500';
}

export function getProgressTrackColor(percentage: number): string {
  if (percentage <= 30) return 'bg-red-100';
  if (percentage <= 70) return 'bg-amber-100';
  return 'bg-emerald-100';
}

export function getProgressTextColor(percentage: number): string {
  if (percentage <= 30) return 'text-red-600';
  if (percentage <= 70) return 'text-amber-600';
  return 'text-emerald-600';
}

export function formatWeddingDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDaysRemainingLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today is the day!';
  if (days === 1) return '1 day to go';
  return `${days} days to go`;
}

const PRIORITY_ORDER: Record<TaskPriorityLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getPriorityMeta(level?: TaskPriorityLevel) {
  const value = level || 'medium';
  const map = {
    high: {
      label: 'High',
      className: 'bg-red-50 text-red-700 ring-red-200',
      iconClass: 'text-red-500',
    },
    medium: {
      label: 'Medium',
      className: 'bg-amber-50 text-amber-700 ring-amber-200',
      iconClass: 'text-amber-500',
    },
    low: {
      label: 'Low',
      className: 'bg-slate-50 text-slate-600 ring-slate-200',
      iconClass: 'text-slate-400',
    },
  } as const;
  return map[value];
}

export function getCategoryMeta(category?: string) {
  const map: Record<string, string> = {
    Venue: 'bg-violet-50 text-violet-700 ring-violet-200',
    Photography: 'bg-pink-50 text-pink-700 ring-pink-200',
    Catering: 'bg-orange-50 text-orange-700 ring-orange-200',
    Shopping: 'bg-sky-50 text-sky-700 ring-sky-200',
    Documentation: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    Other: 'bg-gray-50 text-gray-600 ring-gray-200',
  };
  return map[category || 'Other'] || map.Other;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDueDateStatus(dueDate?: string, status?: string): DueDateStatus {
  if (!dueDate || status === 'completed') return 'none';
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'upcoming';
}

export function getDueDateLabel(status: DueDateStatus, dueDate?: string) {
  if (!dueDate || status === 'none') return null;
  const labels: Record<Exclude<DueDateStatus, 'none'>, string> = {
    overdue: 'Overdue',
    today: 'Due today',
    tomorrow: 'Due tomorrow',
    upcoming: 'Upcoming',
  };
  return labels[status];
}

export function getDueDateCountdown(dueDate?: string, status?: string) {
  const dueStatus = getDueDateStatus(dueDate, status);
  if (!dueDate || dueStatus === 'none') return null;

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due in 1 day';
  return `Due in ${diff} days`;
}

export function getDueDateBadgeClass(status: DueDateStatus) {
  const map = {
    overdue: 'bg-red-50 text-red-700 ring-red-200',
    today: 'bg-orange-50 text-orange-700 ring-orange-200',
    tomorrow: 'bg-amber-50 text-amber-700 ring-amber-200',
    upcoming: 'bg-blue-50 text-blue-700 ring-blue-200',
    none: 'bg-gray-50 text-gray-500 ring-gray-200',
  };
  return map[status];
}

export function buildTaskTree(tasks: WeddingTask[]): PlannerTaskWithSubtasks[] {
  const parents = tasks.filter((t) => !t.parentTaskId);
  return parents.map((task) => ({
    ...task,
    subtasks: tasks.filter((s) => s.parentTaskId === task.id),
  }));
}

export function isTaskComplete(task: PlannerTaskWithSubtasks) {
  if (task.subtasks.length > 0) {
    return task.subtasks.every((s) => s.status === 'completed');
  }
  return task.status === 'completed';
}

export function getSubtaskProgress(task: PlannerTaskWithSubtasks) {
  if (task.subtasks.length === 0) return null;
  const done = task.subtasks.filter((s) => s.status === 'completed').length;
  return { done, total: task.subtasks.length, percentage: Math.round((done / task.subtasks.length) * 100) };
}

export function getTimelineBucket(dueDate: string | undefined, weddingDate: string): TimelineBucket {
  if (!dueDate) return '3 Months Before';

  const wedding = startOfDay(new Date(weddingDate));
  const due = startOfDay(new Date(dueDate));
  const daysBefore = Math.round((wedding.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (daysBefore <= 0) return 'Wedding Day';
  if (daysBefore <= 7) return '1 Week Before';
  if (daysBefore <= 30) return '1 Month Before';
  if (daysBefore <= 90) return '3 Months Before';
  if (daysBefore <= 180) return '6 Months Before';
  return '12 Months Before';
}

export function groupTasksByTimeline(
  tasks: PlannerTaskWithSubtasks[],
  weddingDate: string,
): Record<TimelineBucket, PlannerTaskWithSubtasks[]> {
  const grouped = TIMELINE_BUCKETS.reduce(
    (acc, bucket) => {
      acc[bucket] = [];
      return acc;
    },
    {} as Record<TimelineBucket, PlannerTaskWithSubtasks[]>,
  );

  tasks.forEach((task) => {
    const bucket = getTimelineBucket(task.dueDate, weddingDate);
    grouped[bucket].push(task);
  });

  return grouped;
}

export function filterAndSortTasks(
  tasks: PlannerTaskWithSubtasks[],
  search: string,
  filter: TaskFilter,
  sort: TaskSort,
): PlannerTaskWithSubtasks[] {
  let result = [...tasks];

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.category?.toLowerCase().includes(q) ||
        task.subtasks.some((s) => s.title.toLowerCase().includes(q)),
    );
  }

  if (filter === 'pending') {
    result = result.filter((task) => !isTaskComplete(task));
  } else if (filter === 'completed') {
    result = result.filter((task) => isTaskComplete(task));
  }

  result.sort((a, b) => {
    if (sort === 'priority') {
      const pa = PRIORITY_ORDER[a.priorityLevel || 'medium'];
      const pb = PRIORITY_ORDER[b.priorityLevel || 'medium'];
      return pa - pb;
    }
    if (sort === 'recent') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return da - db;
  });

  return result;
}

export function formatActivityTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function getActivityLabel(action: string) {
  const map: Record<string, string> = {
    added: 'Task added',
    completed: 'Task completed',
    updated: 'Task updated',
  };
  return map[action] || 'Activity';
}
