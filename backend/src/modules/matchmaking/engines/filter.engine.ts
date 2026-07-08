import { ProfileLike } from './compatibility.engine';

export interface ProfileSearchFilters {
  gender?: string;
  religion?: string;
  caste?: string;
  city?: string;
  state?: string;
  diet?: string;
  maritalStatus?: string;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  horoscopeAvailable?: boolean;
  horoscopeMatch?: boolean;
  familyType?: string;
  education?: string;
}

export function resolveViewerGender(
  viewer: ProfileLike | null | undefined,
  userRole?: string,
): 'male' | 'female' | null {
  if (viewer?.gender === 'male' || viewer?.gender === 'female') return viewer.gender;
  if (userRole === 'groom') return 'male';
  if (userRole === 'bride') return 'female';
  return null;
}

export function resolveOppositeGenderFilter(
  viewer: ProfileLike | null | undefined,
  userRole?: string,
): string | undefined {
  const gender = resolveViewerGender(viewer, userRole);
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  return undefined;
}

export function buildSuggestionFilters(
  viewer: ProfileLike,
  userRole?: string,
): ProfileSearchFilters {
  const filters: ProfileSearchFilters = {};

  const oppositeGender = resolveOppositeGenderFilter(viewer, userRole);
  if (oppositeGender) filters.gender = oppositeGender;

  if (viewer.prefReligions?.length) filters.religion = viewer.prefReligions[0];
  else if (viewer.religion) filters.religion = viewer.religion;

  if (viewer.prefCities?.length) filters.city = viewer.prefCities[0];
  else if (viewer.prefLocations?.length) filters.city = viewer.prefLocations[0];
  else if (viewer.city) filters.city = viewer.city;

  if (viewer.prefAgeMin) filters.minAge = viewer.prefAgeMin;
  if (viewer.prefAgeMax) filters.maxAge = viewer.prefAgeMax;
  if (viewer.prefHeightMin) filters.minHeight = viewer.prefHeightMin;
  if (viewer.prefHeightMax) filters.maxHeight = viewer.prefHeightMax;

  if (viewer.prefFamilyType) filters.familyType = viewer.prefFamilyType;
  if (viewer.prefDiet?.length) filters.diet = viewer.prefDiet[0];

  return filters;
}

export function mergeFilters(
  base: ProfileSearchFilters,
  overrides: ProfileSearchFilters,
): ProfileSearchFilters {
  return { ...base, ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined && v !== '')) };
}
