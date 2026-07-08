/**
 * Premium matchmaking helpers.
 * Payment (Razorpay, etc.) will set profile.isPremium later — until then, use isPremium === true.
 */

export function hasActivePremiumSubscription(isPremium?: boolean | null): boolean {
  return isPremium === true;
}

export function isBoostedMatchProfile(profile: {
  isPremium?: boolean | null;
  isBoosted?: boolean | null;
}): boolean {
  return profile.isBoosted === true || profile.isPremium === true;
}

export const PREMIUM_BENEFITS = {
  boostedProfile: 'Your profile ranks higher in Suggested & Search',
  priorityListing: 'Premium badge and boosted visibility',
} as const;
