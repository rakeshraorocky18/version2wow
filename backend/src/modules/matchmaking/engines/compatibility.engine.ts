import { horoscopeMatchScore, isHoroscopeCompatible } from './horoscope.engine';

export type ProfileLike = Record<string, any>;

export interface CompatibilityOptions {
  includeHoroscope?: boolean;
}

export interface CompatibilityResult {
  score: number;
  breakdown: Record<string, number>;
  highlights: string[];
  engine: 'rule-based' | 'ai-weighted';
}

function ageFromDob(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function listIncludes(values: string[] | undefined, value?: string) {
  if (!values?.length || !value) return false;
  return values.some((v) => v.toLowerCase() === value.toLowerCase());
}

function horoscopeScore(viewer: ProfileLike, candidate: ProfileLike): number {
  return horoscopeMatchScore(viewer, candidate);
}

/** Rule-based compatibility engine (ML / Neo4j can replace or augment later). */
export function calculateCompatibility(
  viewer: ProfileLike,
  candidate: ProfileLike,
  options: CompatibilityOptions = {},
): CompatibilityResult {
  const breakdown: Record<string, number> = {
    religion: 0,
    caste: 0,
    location: 0,
    education: 0,
    diet: 0,
    motherTongue: 0,
    age: 0,
    height: 0,
    familyType: 0,
    marital: 0,
    interests: 0,
    lifestyle: 0,
    horoscope: 0,
  };
  const highlights: string[] = [];

  if (viewer.religion && candidate.religion) {
    if (viewer.religion === candidate.religion) {
      breakdown.religion = 15;
      highlights.push('Same religion');
    } else if (listIncludes(viewer.prefReligions, candidate.religion)) {
      breakdown.religion = 12;
      highlights.push('Matches preferred religion');
    }
  }

  if (viewer.caste && candidate.caste) {
    if (viewer.caste === candidate.caste) {
      breakdown.caste = 8;
      highlights.push('Same caste');
    } else if (listIncludes(viewer.prefCastes, candidate.caste)) {
      breakdown.caste = 6;
    }
  }

  if (viewer.city && candidate.city) {
    if (viewer.city === candidate.city) {
      breakdown.location = 12;
      highlights.push('Same city');
    } else if (viewer.state && candidate.state && viewer.state === candidate.state) {
      breakdown.location = 7;
      highlights.push('Same state');
    } else if (listIncludes(viewer.prefCities, candidate.city)) {
      breakdown.location = 8;
    }
  }

  if (viewer.education && candidate.education && viewer.education === candidate.education) {
    breakdown.education = 8;
  }

  if (viewer.diet && candidate.diet && viewer.diet === candidate.diet) {
    breakdown.diet = 8;
    highlights.push('Same diet');
  }

  if (viewer.motherTongue && candidate.motherTongue && viewer.motherTongue === candidate.motherTongue) {
    breakdown.motherTongue = 8;
  }

  const candidateAge = ageFromDob(candidate.dateOfBirth);
  if (candidateAge !== null && (viewer.prefAgeMin || viewer.prefAgeMax)) {
    const inMin = !viewer.prefAgeMin || candidateAge >= viewer.prefAgeMin;
    const inMax = !viewer.prefAgeMax || candidateAge <= viewer.prefAgeMax;
    if (inMin && inMax) {
      breakdown.age = 12;
      highlights.push('Age within preference');
    } else if (inMin || inMax) breakdown.age = 5;
  }

  if (candidate.height && (viewer.prefHeightMin || viewer.prefHeightMax)) {
    const inMin = !viewer.prefHeightMin || candidate.height >= viewer.prefHeightMin;
    const inMax = !viewer.prefHeightMax || candidate.height <= viewer.prefHeightMax;
    if (inMin && inMax) breakdown.height = 8;
    else if (inMin || inMax) breakdown.height = 4;
  }

  if (viewer.familyType && candidate.familyType && viewer.familyType === candidate.familyType) {
    breakdown.familyType = 5;
  }

  if (viewer.maritalStatus && candidate.maritalStatus) {
    if (
      listIncludes(viewer.prefMaritalStatuses, candidate.maritalStatus) ||
      viewer.maritalStatus === candidate.maritalStatus
    ) {
      breakdown.marital = 8;
    }
  }

  if (viewer.interests?.length && candidate.interests?.length) {
    const overlap = viewer.interests.filter((i: string) => candidate.interests?.includes(i));
    if (overlap.length) {
      breakdown.interests = Math.min(6, overlap.length * 2);
      highlights.push(`${overlap.length} shared interest(s)`);
    }
  }

  const lifestyleMatches = ['smoking', 'drinking'].filter(
    (key) => viewer[key] && candidate[key] && viewer[key] === candidate[key],
  );
  if (lifestyleMatches.length) breakdown.lifestyle = lifestyleMatches.length * 3;

  if (options.includeHoroscope !== false) {
    if (isHoroscopeCompatible(viewer, candidate)) {
      breakdown.horoscope = horoscopeScore(viewer, candidate);
      if (breakdown.horoscope >= 10) highlights.push('Horoscope match');
    }
  }

  const raw = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const maxPossible = 120;
  const score = Math.min(100, Math.round((raw / maxPossible) * 100));

  return {
    score,
    breakdown,
    highlights,
    engine: 'ai-weighted',
  };
}
