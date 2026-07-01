import { RotateCcw, SlidersHorizontal, Star } from 'lucide-react';
import { getCastesForReligion, RELIGION_OPTIONS } from '../../lib/religionCasteOptions';
import { EMPTY_FILTERS, type MatchFilters } from '../../types/matchmaking';

type Props = {
  filters: MatchFilters;
  onChange: (filters: MatchFilters) => void;
  matchGenderLabel?: string | null;
  compact?: boolean;
};

function countActiveFilters(filters: MatchFilters) {
  let count = 0;
  if (filters.religion) count += 1;
  if (filters.caste) count += 1;
  if (filters.minAge) count += 1;
  if (filters.maxAge) count += 1;
  if (filters.horoscopeMatch) count += 1;
  return count;
}

export default function MatchFiltersPanel({ filters, onChange, matchGenderLabel, compact }: Props) {
  const activeCount = countActiveFilters(filters);

  return (
    <section className="rounded-2xl border border-[#F2DFE8] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F4E4EC] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF0F5] text-[#B66A8A]">
            <SlidersHorizontal size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#5D2B44]">Filters</h2>
            <p className="text-[11px] text-[#9A5776]">
              {matchGenderLabel ? `${matchGenderLabel} only` : 'All profiles'}
              {activeCount > 0 && ` · ${activeCount} active`}
            </p>
          </div>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E5C8D5] px-3 py-1.5 text-xs font-medium text-[#9A5776] transition hover:bg-[#FFF5F8]"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      <div
        className={
          compact
            ? 'flex flex-wrap items-end gap-3 p-4 sm:p-5'
            : 'grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5'
        }
      >
        <div className={compact ? 'min-w-[140px] flex-1' : ''}>
          <label htmlFor="match-filter-religion" className="profile-field-label text-[11px]">Religion</label>
          <select
            id="match-filter-religion"
            className="profile-input h-10 text-sm"
            value={filters.religion}
            onChange={(e) => onChange({ ...filters, religion: e.target.value, caste: '' })}
          >
            <option value="">All</option>
            {RELIGION_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className={compact ? 'min-w-[140px] flex-1' : ''}>
          <label htmlFor="match-filter-caste" className="profile-field-label text-[11px]">Caste</label>
          <select
            id="match-filter-caste"
            className="profile-input h-10 text-sm"
            value={filters.caste}
            onChange={(e) => onChange({ ...filters, caste: e.target.value })}
            disabled={!filters.religion || getCastesForReligion(filters.religion).length === 0}
          >
            <option value="">All</option>
            {getCastesForReligion(filters.religion).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={compact ? 'min-w-[100px] flex-1' : ''}>
          <label htmlFor="match-filter-min-age" className="profile-field-label text-[11px]">Min age</label>
          <input
            id="match-filter-min-age"
            className="profile-input h-10 text-sm"
            placeholder="18"
            type="number"
            min={18}
            max={80}
            value={filters.minAge}
            onChange={(e) => onChange({ ...filters, minAge: e.target.value })}
          />
        </div>

        <div className={compact ? 'min-w-[100px] flex-1' : ''}>
          <label htmlFor="match-filter-max-age" className="profile-field-label text-[11px]">Max age</label>
          <input
            id="match-filter-max-age"
            className="profile-input h-10 text-sm"
            placeholder="35"
            type="number"
            min={18}
            max={80}
            value={filters.maxAge}
            onChange={(e) => onChange({ ...filters, maxAge: e.target.value })}
          />
        </div>

        <div className={compact ? 'shrink-0' : ''}>
          <span className="profile-field-label text-[11px]">Horoscope match</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.horoscopeMatch}
            onClick={() => onChange({ ...filters, horoscopeMatch: !filters.horoscopeMatch })}
            className={`flex h-10 w-full min-w-[120px] items-center justify-between rounded-xl border px-3 text-xs font-medium transition sm:w-auto ${
              filters.horoscopeMatch
                ? 'border-[#B66A8A] bg-[#FFF0F5] text-[#A65A7D]'
                : 'border-[#E5C8D5] bg-[#FFFBFC] text-[#9A5776]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Star size={13} className={filters.horoscopeMatch ? 'fill-[#B66A8A] text-[#B66A8A]' : ''} />
              Match
            </span>
            <span
              className={`relative h-5 w-9 rounded-full transition ${filters.horoscopeMatch ? 'bg-[#B66A8A]' : 'bg-[#E5C8D5]'}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  filters.horoscopeMatch ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
