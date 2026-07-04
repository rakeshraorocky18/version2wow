import { useEffect, useState } from 'react';
import { Bookmark, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { getCastesForReligion, RELIGION_OPTIONS } from '../../lib/religionCasteOptions';
import {
  deleteSavedSearch,
  getRecentFilters,
  getSavedSearches,
  pushRecentFilters,
  saveSearch,
  type SavedSearch,
} from '../../lib/savedMatchSearch';
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
  if (filters.verifiedOnly) count += 1;
  if (filters.minProfileCompletion) count += 1;
  return count;
}

export default function MatchFiltersPanel({ filters, onChange, matchGenderLabel }: Props) {
  const activeCount = countActiveFilters(filters);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => getSavedSearches());
  const [recentFilters, setRecentFilters] = useState<MatchFilters[]>(() => getRecentFilters());
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setRecentFilters(pushRecentFilters(filters));
    }, 800);
    return () => window.clearTimeout(t);
  }, [filters]);

  const handleSaveSearch = () => {
    const next = saveSearch(saveName || 'My search', filters);
    setSavedSearches(next);
    setSaveName('');
    setShowSaveInput(false);
  };

  return (
    <aside className="dp-filter-sidebar">
      <h4 className="dp-filter-sidebar__title">Member Search</h4>
      <div className="dp-filter-sidebar__wrapper dp-glass-panel">
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
          <div className="dp-filter-sidebar__actions">
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
            <button
              type="button"
              onClick={() => setShowSaveInput((v) => !v)}
              className="dp-filter-sidebar__save"
              disabled={activeCount === 0}
            >
              <Bookmark size={14} />
              Save search
            </button>
          </div>
        </div>

        {showSaveInput && (
          <div className="dp-filter-save-row">
            <input
              type="text"
              className="dp-filter-input"
              placeholder="Search name (optional)"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button type="button" className="dp-filter-save-btn" onClick={handleSaveSearch}>
              Save
            </button>
          </div>
        )}

        {savedSearches.length > 0 && (
          <div className="dp-filter-recent">
            <p className="dp-filter-recent__label">Saved searches</p>
            <div className="dp-filter-recent__chips">
              {savedSearches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="dp-filter-chip"
                  onClick={() => onChange({ ...s.filters })}
                >
                  {s.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="dp-filter-chip__remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSavedSearches(deleteSavedSearch(s.id));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        setSavedSearches(deleteSavedSearch(s.id));
                      }
                    }}
                    aria-label={`Remove ${s.name}`}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {recentFilters.length > 1 && (
          <div className="dp-filter-recent">
            <p className="dp-filter-recent__label">Recently used</p>
            <div className="dp-filter-recent__chips">
              {recentFilters.slice(1, 4).map((recent, i) => (
                <button
                  key={i}
                  type="button"
                  className="dp-filter-chip dp-filter-chip--muted"
                  onClick={() => onChange({ ...recent })}
                >
                  Recent {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

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

        <div className="dp-filter-field">
          <label htmlFor="match-filter-completion" className="dp-filter-label">
            Min. profile completion
          </label>
          <select
            id="match-filter-completion"
            className="dp-filter-input"
            value={filters.minProfileCompletion}
            onChange={(e) => onChange({ ...filters, minProfileCompletion: e.target.value })}
          >
            <option value="">Any completion</option>
            <option value="50">50%+ complete</option>
            <option value="70">70%+ complete</option>
            <option value="85">85%+ complete</option>
          </select>
        </div>

        <div className="dp-filter-field">
          <span className="dp-filter-label">Verified members only</span>
          <div className={`dp-filter-toggle ${filters.verifiedOnly ? 'is-on' : ''}`}>
            <span>{filters.verifiedOnly ? 'Verified only' : 'All members'}</span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.verifiedOnly}
              aria-label="Verified members only"
              onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
              className="dp-filter-switch"
            >
              <span />
            </button>
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
