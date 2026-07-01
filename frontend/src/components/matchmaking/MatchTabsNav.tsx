import { type LucideIcon } from 'lucide-react';
import type { MatchTab } from '../../types/matchmaking';

export type MatchTabMeta = {
  id: MatchTab;
  label: string;
  icon: LucideIcon;
  count?: number;
  badge?: number;
};

type Props = {
  tabs: MatchTabMeta[];
  active: MatchTab;
  onChange: (tab: MatchTab) => void;
};

export default function MatchTabsNav({ tabs, active, onChange }: Props) {
  return (
    <nav
      aria-label="Match sections"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-[#F0DFE7] bg-[#FFFBFC] p-1.5 scrollbar-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-[#B66A8A] to-[#9B5A80] text-white shadow-md shadow-[#B66A8A]/25'
                : 'text-[#7B4A62] hover:bg-[#FFF0F5]'
            }`}
          >
            <Icon size={16} strokeWidth={2.2} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#F7E4EC] text-[#A65A7D]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
