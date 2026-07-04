import type { MatchFilters } from '../types/matchmaking';

const SAVED_SEARCHES_KEY = 'wow-saved-match-searches';
const RECENT_FILTERS_KEY = 'wow-recent-match-filters';
const MAX_SAVED = 8;
const MAX_RECENT = 5;

export type SavedSearch = {
  id: string;
  name: string;
  filters: MatchFilters;
  savedAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSavedSearches(): SavedSearch[] {
  return readJson<SavedSearch[]>(SAVED_SEARCHES_KEY, []);
}

export function saveSearch(name: string, filters: MatchFilters): SavedSearch[] {
  const list = getSavedSearches().filter(
    (s) => JSON.stringify(s.filters) !== JSON.stringify(filters),
  );
  const entry: SavedSearch = {
    id: crypto.randomUUID(),
    name: name.trim() || 'My search',
    filters: { ...filters },
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...list].slice(0, MAX_SAVED);
  writeJson(SAVED_SEARCHES_KEY, next);
  return next;
}

export function deleteSavedSearch(id: string): SavedSearch[] {
  const next = getSavedSearches().filter((s) => s.id !== id);
  writeJson(SAVED_SEARCHES_KEY, next);
  return next;
}

export function getRecentFilters(): MatchFilters[] {
  return readJson<MatchFilters[]>(RECENT_FILTERS_KEY, []);
}

export function pushRecentFilters(filters: MatchFilters): MatchFilters[] {
  const hasActive = Object.entries(filters).some(([key, value]) => {
    if (key === 'horoscopeMatch') return value === true;
    return Boolean(value);
  });
  if (!hasActive) return getRecentFilters();

  const list = getRecentFilters().filter((f) => JSON.stringify(f) !== JSON.stringify(filters));
  const next = [{ ...filters }, ...list].slice(0, MAX_RECENT);
  writeJson(RECENT_FILTERS_KEY, next);
  return next;
}
