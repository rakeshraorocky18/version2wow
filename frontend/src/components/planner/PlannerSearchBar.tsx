import { Search } from 'lucide-react';

interface PlannerSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlannerSearchBar({ value, onChange }: PlannerSearchBarProps) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A5776]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks by title..."
        className="w-full rounded-xl border border-[#E5C8D5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#5D2B44] outline-none transition placeholder:text-[#C4A0B0] focus:border-[#B66A8A] focus:ring-2 focus:ring-[#F4D8E4]"
      />
    </div>
  );
}
