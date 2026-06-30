export type MatchTab = 'suggestions' | 'search' | 'shortlist' | 'interests';

export interface MatchFilters {
  gender: string;
  religion: string;
  caste: string;
  city: string;
  state: string;
  diet: string;
  maritalStatus: string;
  minAge: string;
  maxAge: string;
  minHeight: string;
  maxHeight: string;
  horoscopeAvailable: boolean;
  includeHoroscope: boolean;
}

export interface CompatibilityInfo {
  score: number;
  breakdown: Record<string, number>;
  highlights: string[];
  engine: string;
}

export interface MatchProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  city?: string;
  state?: string;
  religion?: string;
  occupation?: string;
  education?: string;
  photos?: string[];
  wizardProfile?: { profilePhoto?: string };
  compatibilityScore?: number;
  compatibility?: CompatibilityInfo;
}

export const EMPTY_FILTERS: MatchFilters = {
  gender: '',
  religion: '',
  caste: '',
  city: '',
  state: '',
  diet: '',
  maritalStatus: '',
  minAge: '',
  maxAge: '',
  minHeight: '',
  maxHeight: '',
  horoscopeAvailable: false,
  includeHoroscope: true,
};
