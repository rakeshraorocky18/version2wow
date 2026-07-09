import { EMPTY_FILTERS, type MatchFilters } from '../types/matchmaking';

const SAVED_SEARCHES_KEY = 'wow-saved-match-searches';
const MAX_SAVED = 8;

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

function sanitizeFilters(filters: Partial<MatchFilters> | null | undefined): MatchFilters {
  const next = { ...EMPTY_FILTERS };
  const raw = filters ?? {};
  (Object.keys(EMPTY_FILTERS) as Array<keyof MatchFilters>).forEach((key) => {
    if (key in raw) {
      next[key] = raw[key] as never;
    }
  });
  return next;
}

export function getSavedSearches(): SavedSearch[] {
  return readJson<SavedSearch[]>(SAVED_SEARCHES_KEY, []).map((search) => ({
    ...search,
    filters: sanitizeFilters(search.filters),
  }));
}

export function saveSearch(name: string, filters: MatchFilters): SavedSearch[] {
  const list = getSavedSearches().filter(
    (s) => JSON.stringify(s.filters) !== JSON.stringify(filters),
  );
  const entry: SavedSearch = {
    id: crypto.randomUUID(),
    name: name.trim() || 'My search',
    filters: sanitizeFilters(filters),
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

