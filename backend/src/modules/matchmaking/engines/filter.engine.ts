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
  familyType?: string;
  education?: string;
}

export function buildSuggestionFilters(viewer: ProfileLike): ProfileSearchFilters {
  const filters: ProfileSearchFilters = {};

  if (viewer.gender === 'male') filters.gender = 'female';
  else if (viewer.gender === 'female') filters.gender = 'male';

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
