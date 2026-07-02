/** Score bump for premium profiles in match listings (payment integration comes later). */
export const PREMIUM_MATCH_BOOST = 12;

export function isPremiumSubscriber(profile: Record<string, unknown>): boolean {
  return profile.isPremium === true;
}

export function applyPremiumMatchBoost(score: number, profile: Record<string, unknown>): number {
  if (!isPremiumSubscriber(profile)) return score;
  return Math.min(100, score + PREMIUM_MATCH_BOOST);
}

export function enrichWithPremiumBoost(
  profile: Record<string, unknown>,
  compatibilityScore: number,
): Record<string, unknown> {
  const premium = isPremiumSubscriber(profile);
  return {
    ...profile,
    compatibilityScore,
    isBoosted: premium,
  };
}
