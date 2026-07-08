import { ArrowDownAZ, Calendar, Clock } from 'lucide-react';
import type { TaskFilter, TaskSort } from '../../types/planner';

interface PlannerFiltersProps {
  filter: TaskFilter;
  sort: TaskSort;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
}

const filters: { id: TaskFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
];

const sorts: { id: TaskSort; label: string; icon: typeof Calendar }[] = [
  { id: 'dueDate', label: 'Due Date', icon: Calendar },
  { id: 'priority', label: 'Priority', icon: ArrowDownAZ },
  { id: 'recent', label: 'Recently Added', icon: Clock },
];

export default function PlannerFilters({ filter, sort, onFilterChange, onSortChange }: PlannerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onFilterChange(id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === id
                ? 'bg-[#B66A8A] text-white shadow-sm'
                : 'bg-white text-[#815A6D] ring-1 ring-[#F0DFE7] hover:bg-[#FFF5F8]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#9A5776]">Sort by</span>
        {sorts.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSortChange(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              sort === id
                ? 'bg-[#F8F5FF] text-[#6E4A9C] ring-1 ring-[#E8DFF5]'
                : 'bg-white text-[#815A6D] ring-1 ring-[#F0DFE7] hover:bg-[#FFFBFC]'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
