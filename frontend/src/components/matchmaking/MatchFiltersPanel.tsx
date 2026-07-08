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
    <aside className="dp-filter-sidebar">
      <h4 className="dp-filter-sidebar__title">Member Search</h4>
      <div className="dp-filter-sidebar__wrapper">
        <div className="dp-filter-sidebar__header">
          <span className="dp-filter-sidebar__icon">
            <SlidersHorizontal size={18} />
          </span>
          <p className="dp-filter-sidebar__subtitle">
            {matchGenderLabel
              ? `Showing ${matchGenderLabel.toLowerCase()} only`
              : activeCount === 0
                ? 'Showing all profiles'
                : `${activeCount} filter${activeCount === 1 ? '' : 's'} applied`}
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="dp-filter-sidebar__clear"
            >
              <RotateCcw size={14} />
              Clear all
            </button>
          )}
        </div>

        <div className="dp-filter-field">
          <label htmlFor="match-filter-religion" className="dp-filter-label">Religion</label>
          <select
            id="match-filter-religion"
            className="dp-filter-input"
            value={filters.religion}
            onChange={(e) => onChange({ ...filters, religion: e.target.value, caste: '' })}
          >
            <option value="">All religions</option>
            {RELIGION_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="dp-filter-field">
          <label htmlFor="match-filter-caste" className="dp-filter-label">Caste</label>
          <select
            id="match-filter-caste"
            className="dp-filter-input"
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

        <div className="dp-filter-field">
          <span className="dp-filter-label">Age range</span>
          <div className="dp-filter-age-row">
            <input
              className="dp-filter-input"
              placeholder="Min"
              type="number"
              min={18}
              max={80}
              value={filters.minAge}
              onChange={(e) => onChange({ ...filters, minAge: e.target.value })}
              aria-label="Minimum age"
            />
            <span>to</span>
            <input
              className="dp-filter-input"
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

        <div className="dp-filter-field dp-filter-field--last">
          <span className="dp-filter-label">Horoscope match</span>
          <div className={`dp-filter-toggle ${filters.horoscopeMatch ? 'is-on' : ''}`}>
            <span>{filters.horoscopeMatch ? 'Enabled' : 'Disabled'}</span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.horoscopeMatch}
              aria-label="Horoscope"
              onClick={() => onChange({ ...filters, horoscopeMatch: !filters.horoscopeMatch })}
              className="dp-filter-switch"
            >
              <span />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
