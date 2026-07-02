export type ProfileLike = Record<string, unknown>;

const RASHI_ALIASES: Record<string, string> = {
  mesha: 'mesha',
  aries: 'mesha',
  vrishabha: 'vrishabha',
  vrishab: 'vrishabha',
  taurus: 'vrishabha',
  mithuna: 'mithuna',
  mithun: 'mithuna',
  gemini: 'mithuna',
  karka: 'karka',
  kark: 'karka',
  cancer: 'karka',
  simha: 'simha',
  singh: 'simha',
  leo: 'simha',
  kanya: 'kanya',
  virgo: 'kanya',
  tula: 'tula',
  libra: 'tula',
  vrishchika: 'vrishchika',
  vrischika: 'vrishchika',
  scorpio: 'vrishchika',
  dhanu: 'dhanu',
  dhan: 'dhanu',
  sagittarius: 'dhanu',
  makara: 'makara',
  makar: 'makara',
  capricorn: 'makara',
  kumbha: 'kumbha',
  kumbh: 'kumbha',
  aquarius: 'kumbha',
  meena: 'meena',
  mina: 'meena',
  pisces: 'meena',
};

/** Compatible rashis for male–female horoscope matching (simplified Vedic friendship pairs). */
const RASHI_COMPAT: Record<string, string[]> = {
  mesha: ['simha', 'dhanu', 'mithuna', 'tula'],
  vrishabha: ['kanya', 'makara', 'karka', 'meena'],
  mithuna: ['tula', 'kumbha', 'mesha', 'simha'],
  karka: ['vrishchika', 'meena', 'vrishabha', 'kanya'],
  simha: ['dhanu', 'mesha', 'tula', 'mithuna'],
  kanya: ['makara', 'vrishabha', 'vrishchika', 'karka'],
  tula: ['kumbha', 'mithuna', 'dhanu', 'simha'],
  vrishchika: ['meena', 'karka', 'makara', 'kanya'],
  dhanu: ['mesha', 'simha', 'kumbha', 'tula'],
  makara: ['vrishabha', 'kanya', 'meena', 'vrishchika'],
  kumbha: ['mithuna', 'tula', 'mesha', 'dhanu'],
  meena: ['karka', 'vrishchika', 'vrishabha', 'makara'],
};

function normalizeRashi(value?: string): string | null {
  if (!value) return null;
  const key = value.toLowerCase().trim().replace(/\s+/g, ' ');
  return RASHI_ALIASES[key] || RASHI_ALIASES[key.split(' ')[0]] || null;
}

function profileString(profile: ProfileLike, key: string): string | undefined {
  const value = profile[key];
  return typeof value === 'string' ? value : undefined;
}

export function hasHoroscopeDetails(profile: ProfileLike): boolean {
  return !!(
    profile.horoscopeAvailable === true &&
    profileString(profile, 'rashi') &&
    profileString(profile, 'nakshatra')
  );
}

function isManglikCompatible(viewerManglik?: string, candidateManglik?: string): boolean {
  const norm = (v?: string) => (v || '').toLowerCase().trim();
  const a = norm(viewerManglik);
  const b = norm(candidateManglik);
  if (!a || !b) return true;
  if (a.includes("don't") || b.includes("don't") || a === 'partial' || b === 'partial') return true;
  if (a === 'yes' && b === 'no') return false;
  if (a === 'no' && b === 'yes') return false;
  return true;
}

function areRashisCompatible(viewerRashi?: string, candidateRashi?: string): boolean {
  const a = normalizeRashi(viewerRashi);
  const b = normalizeRashi(candidateRashi);
  if (!a || !b) return true;
  if (a === b) return true;
  return RASHI_COMPAT[a]?.includes(b) || RASHI_COMPAT[b]?.includes(a) || false;
}

/** True when male & female horoscope details exist and are compatible for matching. */
export function isHoroscopeCompatible(viewer: ProfileLike, candidate: ProfileLike): boolean {
  if (!hasHoroscopeDetails(viewer) || !hasHoroscopeDetails(candidate)) return false;
  if (!isManglikCompatible(profileString(viewer, 'manglik'), profileString(candidate, 'manglik'))) return false;
  return areRashisCompatible(profileString(viewer, 'rashi'), profileString(candidate, 'rashi'));
}

export function horoscopeMatchScore(viewer: ProfileLike, candidate: ProfileLike): number {
  if (!isHoroscopeCompatible(viewer, candidate)) return 0;
  let score = 10;
  const viewerNakshatra = profileString(viewer, 'nakshatra');
  const candidateNakshatra = profileString(candidate, 'nakshatra');
  if (viewerNakshatra && candidateNakshatra && viewerNakshatra === candidateNakshatra) score += 4;
  const viewerSign = profileString(viewer, 'zodiacSign') || profileString(viewer, 'horoscope');
  const candidateSign = profileString(candidate, 'zodiacSign') || profileString(candidate, 'horoscope');
  if (viewerSign && candidateSign && viewerSign === candidateSign) score += 3;
  return score;
}
