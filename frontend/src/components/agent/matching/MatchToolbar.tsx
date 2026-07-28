import { LayoutGrid, List, Loader2, RefreshCw, Search, X } from 'lucide-react';
import type { AgentMatchFilters, MatchSortBy, MatchViewMode } from '../../../types/agentMatching';

export interface FilterChip {
  key: string;
  label: string;
}

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: MatchSortBy;
  onSortChange: (value: MatchSortBy) => void;
  viewMode: MatchViewMode;
  onViewModeChange: (value: MatchViewMode) => void;
  resultCount: number;
  isFetching?: boolean;
  onRefresh?: () => void;
  activeChips?: FilterChip[];
  onRemoveChip?: (key: string) => void;
  onClearChips?: () => void;
}

export function buildActiveFilterChips(filters: AgentMatchFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  const add = (key: keyof AgentMatchFilters, label: string, value?: string | boolean) => {
    if (typeof value === 'boolean') {
      if (value) chips.push({ key, label });
      return;
    }
    if (value?.trim()) chips.push({ key, label: `${label}: ${value.trim()}` });
  };

  add('religion', 'Religion', filters.religion);
  add('caste', 'Caste', filters.caste);
  add('subCaste', 'Sub Caste', filters.subCaste);
  if (filters.minAge || filters.maxAge) {
    chips.push({
      key: 'age',
      label: `Age: ${filters.minAge || '…'}–${filters.maxAge || '…'}`,
    });
  }
  if (filters.minHeight || filters.maxHeight) {
    chips.push({
      key: 'height',
      label: `Height: ${filters.minHeight || '…'}–${filters.maxHeight || '…'}`,
    });
  }
  add('maritalStatus', 'Marital', filters.maritalStatus);
  add('motherTongue', 'Tongue', filters.motherTongue);
  add('education', 'Education', filters.education);
  add('occupation', 'Occupation', filters.occupation);
  add('annualIncome', 'Income', filters.annualIncome);
  add('country', 'Country', filters.country);
  add('state', 'State', filters.state);
  add('city', 'City', filters.city);
  add('familyStatus', 'Family Status', filters.familyStatus);
  add('familyType', 'Family Type', filters.familyType);
  add('foodPreference', 'Diet', filters.foodPreference);
  add('smoking', 'Smoking', filters.smoking);
  add('drinking', 'Drinking', filters.drinking);
  add('horoscope', 'Horoscope', filters.horoscope);
  add('manglik', 'Manglik', filters.manglik);
  add('verifiedOnly', 'Verified only', filters.verifiedOnly);
  add('premiumOnly', 'Premium only', filters.premiumOnly);
  add('recentlyActive', 'Recently active', filters.recentlyActive);
  return chips;
}

export default function MatchToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount,
  isFetching,
  onRefresh,
  activeChips = [],
  onRemoveChip,
  onClearChips,
}: Props) {
  return (
    <div
      className="sticky top-0 z-10 space-y-3 rounded-[20px] border border-gray-100 bg-white/95 p-4 backdrop-blur"
      style={{ boxShadow: '0 6px 24px rgba(182, 106, 138, 0.07)' }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-wow-muted" />
          <input
            className="w-full rounded-2xl border border-gray-200 bg-[#FAF8FB] py-3 pl-11 pr-3 text-sm outline-none transition duration-200 focus:border-wow-primary focus:bg-white focus:ring-2 focus:ring-wow-primary/20"
            placeholder="Search profiles by name, code, or phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="rounded-2xl border border-gray-100 bg-[#FAF8FB] px-3.5 py-2.5 text-sm">
            <span className="text-wow-muted">Results </span>
            <span className="font-semibold tabular-nums text-wow-primary">{resultCount}</span>
            {isFetching && (
              <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-wow-muted" />
            )}
          </div>

          <select
            className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-wow-primary focus:ring-2 focus:ring-wow-primary/20"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as MatchSortBy)}
          >
            <option value="compatibility">Highest Compatibility</option>
            <option value="newest">Newest</option>
            <option value="recently_active">Recently Active</option>
            <option value="completion">Profile Completion</option>
          </select>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-wow-text transition hover:border-wow-primary/30 hover:text-wow-primary"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition ${
                viewMode === 'grid'
                  ? 'bg-wow-primary text-white shadow-sm'
                  : 'text-wow-muted hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" /> Grid
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition ${
                viewMode === 'list'
                  ? 'bg-wow-primary text-white shadow-sm'
                  : 'text-wow-muted hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" /> List
            </button>
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
          <span className="text-xs font-medium text-wow-muted">Active filters</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onRemoveChip?.(chip.key)}
              className="inline-flex items-center gap-1.5 rounded-full border border-wow-primary/20 bg-[#FFF5F7] px-2.5 py-1 text-xs font-medium text-wow-primary transition hover:bg-wow-primary/10"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClearChips}
            className="text-xs font-medium text-wow-muted underline-offset-2 hover:text-wow-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
