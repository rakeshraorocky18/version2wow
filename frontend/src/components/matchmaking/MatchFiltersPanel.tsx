import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { getCastesForReligion, RELIGION_OPTIONS } from '../../lib/religionCasteOptions';
import { EMPTY_FILTERS, type MatchFilters } from '../../types/matchmaking';

type Props = {
  filters: MatchFilters;
  onChange: (filters: MatchFilters) => void;
  matchGenderLabel?: string | null;
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

export default function MatchFiltersPanel({ filters, onChange, matchGenderLabel }: Props) {
  const activeCount = countActiveFilters(filters);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#F2DFE8] bg-gradient-to-br from-[#FFFBFC] via-white to-[#FFF8FB] shadow-[0_8px_30px_rgba(174,94,129,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F4E4EC] bg-white/60 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F9DEE7] to-[#F6E8FF] text-[#A4426A]">
            <SlidersHorizontal size={18} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Refine your search</h2>
            <p className="text-xs text-[#9A5776]">
              {matchGenderLabel
                ? `Showing ${matchGenderLabel.toLowerCase()} only`
                : activeCount === 0
                  ? 'Showing all profiles'
                  : `${activeCount} filter${activeCount === 1 ? '' : 's'} applied`}
            </p>
          </div>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5C8D5] bg-white px-4 py-2 text-xs font-semibold text-[#9A5776] transition hover:border-[#D4A8BC] hover:text-[#7B4A62]"
          >
            <RotateCcw size={14} />
            Clear all
          </button>
        )}
      </div>

      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label htmlFor="match-filter-religion" className="profile-field-label">Religion</label>
          <select
            id="match-filter-religion"
            className="profile-input"
            value={filters.religion}
            onChange={(e) => onChange({ ...filters, religion: e.target.value, caste: '' })}
          >
            <option value="">All religions</option>
            {RELIGION_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="match-filter-caste" className="profile-field-label">Caste</label>
          <select
            id="match-filter-caste"
            className="profile-input"
            value={filters.caste}
            onChange={(e) => onChange({ ...filters, caste: e.target.value })}
            disabled={!filters.religion || getCastesForReligion(filters.religion).length === 0}
          >
            <option value="">All castes</option>
            {getCastesForReligion(filters.religion).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 xl:col-span-1">
          <span className="profile-field-label">Age range</span>
          <div className="flex items-center gap-2">
            <input
              className="profile-input"
              placeholder="Min"
              type="number"
              min={18}
              max={80}
              value={filters.minAge}
              onChange={(e) => onChange({ ...filters, minAge: e.target.value })}
              aria-label="Minimum age"
            />
            <span className="shrink-0 text-sm font-medium text-[#C4A0B0]">to</span>
            <input
              className="profile-input"
              placeholder="Max"
              type="number"
              min={18}
              max={80}
              value={filters.maxAge}
              onChange={(e) => onChange({ ...filters, maxAge: e.target.value })}
              aria-label="Maximum age"
            />
          </div>
        </div>

        <div>
          <span className="profile-field-label">Horoscope</span>
          <div
            className={`flex h-[46px] items-center justify-end rounded-xl border px-4 transition ${
              filters.horoscopeMatch
                ? 'border-[#D4A8BC] bg-gradient-to-r from-[#FFF0F5] to-[#F8F0FF]'
                : 'border-[#E5C8D5] bg-[#FFFBFC]'
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={filters.horoscopeMatch}
              aria-label="Horoscope"
              onClick={() => onChange({ ...filters, horoscopeMatch: !filters.horoscopeMatch })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                filters.horoscopeMatch ? 'bg-[#B66A8A]' : 'bg-[#E5C8D5]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  filters.horoscopeMatch ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
