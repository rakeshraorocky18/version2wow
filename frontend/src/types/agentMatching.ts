import type { Paginated } from './agent';

export type MatchSortBy =
  | 'newest'
  | 'compatibility'
  | 'recently_active'
  | 'completion';

export type MatchViewMode = 'grid' | 'list';

export interface AgentMatchFilters {
  religion: string;
  caste: string;
  subCaste: string;
  minAge: string;
  maxAge: string;
  minHeight: string;
  maxHeight: string;
  maritalStatus: string;
  motherTongue: string;
  education: string;
  occupation: string;
  annualIncome: string;
  country: string;
  state: string;
  city: string;
  familyType: string;
  familyStatus: string;
  foodPreference: string;
  smoking: string;
  drinking: string;
  horoscope: string;
  manglik: string;
  minProfileCompletion: string;
  verifiedOnly: boolean;
  premiumOnly: boolean;
  recentlyActive: boolean;
}

export interface AgentMatchProfile {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  name: string;
  gender?: string;
  age?: number | null;
  height?: string | null;
  religion?: string;
  caste?: string;
  community?: string;
  aboutMe?: string;
  education?: string;
  occupation?: string;
  city?: string;
  state?: string;
  country?: string;
  maritalStatus?: string;
  profileCompletion: number;
  assignedAgentId?: string;
  phone?: string;
  profilePhoto?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  onlineStatus?: boolean;
  recentlyActive?: boolean;
  compatibilityScore: number;
  reasons?: string[];
  isBestMatch?: boolean;
  isTopRecommendation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMatchSearchPayload
  extends Omit<Partial<AgentMatchFilters>, 'minAge' | 'maxAge' | 'minProfileCompletion'> {
  search?: string;
  sortBy?: MatchSortBy;
  page?: number;
  limit?: number;
  minAge?: number | string;
  maxAge?: number | string;
  minProfileCompletion?: number | string;
}

export interface AgentMatchSearchResult extends Paginated<AgentMatchProfile> {
  customerId: string;
  customerName: string;
}

export interface AgentRecommendationsResult {
  customerId: string;
  customerName: string;
  data: AgentMatchProfile[];
  total: number;
}

export const EMPTY_MATCH_FILTERS: AgentMatchFilters = {
  religion: '',
  caste: '',
  subCaste: '',
  minAge: '',
  maxAge: '',
  minHeight: '',
  maxHeight: '',
  maritalStatus: '',
  motherTongue: '',
  education: '',
  occupation: '',
  annualIncome: '',
  country: '',
  state: '',
  city: '',
  familyType: '',
  familyStatus: '',
  foodPreference: '',
  smoking: '',
  drinking: '',
  horoscope: '',
  manglik: '',
  minProfileCompletion: '',
  verifiedOnly: false,
  premiumOnly: false,
  recentlyActive: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function pickStr(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const s = String(value).trim();
    if (s) return s;
  }
  return '';
}

function parseAgeRange(ageRange: unknown): { minAge: string; maxAge: string } {
  const raw = pickStr(ageRange);
  if (!raw) return { minAge: '', maxAge: '' };
  const rangeMatch = raw.match(/(\d+)\s*[-–to]+\s*(\d+)/i);
  if (rangeMatch) return { minAge: rangeMatch[1], maxAge: rangeMatch[2] };
  return { minAge: '', maxAge: '' };
}

export function filtersFromPartnerPreferences(
  partnerPreferences?: Record<string, unknown> | null,
): AgentMatchFilters {
  const prefs = asRecord(partnerPreferences);
  const preferredLocation = asRecord(prefs.preferredLocation);
  const { minAge, maxAge } = parseAgeRange(prefs.ageRange);

  return {
    ...EMPTY_MATCH_FILTERS,
    religion: pickStr(prefs.religion),
    caste: pickStr(prefs.caste),
    subCaste: pickStr(prefs.subCaste),
    minAge,
    maxAge,
    maritalStatus: pickStr(prefs.maritalStatus),
    motherTongue: pickStr(prefs.motherTongue),
    education: pickStr(prefs.education),
    occupation: pickStr(prefs.profession, prefs.occupation),
    annualIncome: pickStr(prefs.annualIncome, prefs.income),
    country: pickStr(
      preferredLocation.country,
      preferredLocation.countryOther,
      prefs.country,
    ),
    state: pickStr(preferredLocation.state, preferredLocation.stateOther, prefs.state),
    city: pickStr(
      preferredLocation.city,
      preferredLocation.cityOther,
      prefs.city,
      prefs.location,
      prefs.specificArea,
    ),
    familyType: pickStr(prefs.familyType),
    familyStatus: pickStr(prefs.familyStatus),
    foodPreference: pickStr(prefs.foodPreference, prefs.diet),
    smoking: pickStr(prefs.smoking),
    drinking: pickStr(prefs.drinking),
    horoscope: pickStr(prefs.horoscope, prefs.rasi, prefs.star),
    manglik: pickStr(prefs.manglik, prefs.kujaDosham),
  };
}

export function toMatchSearchPayload(
  filters: AgentMatchFilters,
  extras: {
    search?: string;
    sortBy?: MatchSortBy;
    page?: number;
    limit?: number;
  },
): AgentMatchSearchPayload {
  const payload: AgentMatchSearchPayload = {
    sortBy: extras.sortBy || 'compatibility',
    page: extras.page || 1,
    limit: extras.limit || 12,
  };

  if (extras.search?.trim()) payload.search = extras.search.trim();

  const stringKeys: Array<keyof AgentMatchFilters> = [
    'religion',
    'caste',
    'subCaste',
    'minHeight',
    'maxHeight',
    'maritalStatus',
    'motherTongue',
    'education',
    'occupation',
    'annualIncome',
    'country',
    'state',
    'city',
    'familyType',
    'familyStatus',
    'foodPreference',
    'smoking',
    'drinking',
    'horoscope',
    'manglik',
  ];

  for (const key of stringKeys) {
    const value = filters[key];
    if (typeof value === 'string' && value.trim()) {
      (payload as Record<string, unknown>)[key] = value.trim();
    }
  }

  if (filters.minAge.trim()) payload.minAge = Number(filters.minAge);
  if (filters.maxAge.trim()) payload.maxAge = Number(filters.maxAge);
  if (filters.minProfileCompletion.trim()) {
    const n = Number(filters.minProfileCompletion);
    if (Number.isFinite(n) && n > 0) payload.minProfileCompletion = n;
  }

  if (filters.verifiedOnly) payload.verifiedOnly = true;
  if (filters.premiumOnly) payload.premiumOnly = true;
  if (filters.recentlyActive) payload.recentlyActive = true;

  return payload;
}
