/** Subscription tiers, score boosts, and listing priority for matchmaking. */

export type SubscriptionType = 'Free' | 'Basic' | 'Premium' | 'Platinum';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    subscriptionType: 'Basic' as SubscriptionType,
    price: 499,
    currency: 'INR',
    durationDays: 30,
    scoreBoost: 5,
    benefits: [
      'Premium badge on your profile',
      'Higher visibility in search results',
      'See who viewed your profile',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    subscriptionType: 'Premium' as SubscriptionType,
    price: 999,
    currency: 'INR',
    durationDays: 30,
    scoreBoost: 12,
    popular: true,
    benefits: [
      'Everything in Basic',
      'Priority placement in match listings',
      '1 free profile boost per month',
      'Advanced compatibility insights',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    subscriptionType: 'Platinum' as SubscriptionType,
    price: 1999,
    currency: 'INR',
    durationDays: 30,
    scoreBoost: 20,
    benefits: [
      'Everything in Premium',
      'Top priority in all listings',
      '3 free profile boosts per month',
      'Dedicated match advisor support',
    ],
  },
] as const;

export const BOOST_DURATION_HOURS = 24;
export const ACTIVE_BOOST_SCORE_BONUS = 15;

const TIER_SCORE_BOOST: Record<SubscriptionType, number> = {
  Free: 0,
  Basic: 5,
  Premium: 12,
  Platinum: 20,
};

const LISTING_TIER: Record<SubscriptionType, number> = {
  Free: 2,
  Basic: 1,
  Premium: 1,
  Platinum: 1,
};

export function resolveSubscriptionType(profile: Record<string, unknown>): SubscriptionType {
  const raw = String(profile.subscriptionType || 'Free') as SubscriptionType;
  if (raw === 'Basic' || raw === 'Premium' || raw === 'Platinum') return raw;
  if (profile.isPremium === true) return 'Premium';
  return 'Free';
}

export function isPremiumSubscriber(profile: Record<string, unknown>): boolean {
  return resolveSubscriptionType(profile) !== 'Free';
}

export function isActiveBoost(profile: Record<string, unknown>): boolean {
  const expires = profile.boostExpiresAt;
  if (!expires) return false;
  return new Date(String(expires)).getTime() > Date.now();
}

/** Listing priority: 0 = boosted, 1 = paid subscriber, 2 = free */
export function getListingPriorityTier(profile: Record<string, unknown>): number {
  if (isActiveBoost(profile)) return 0;
  const sub = resolveSubscriptionType(profile);
  return LISTING_TIER[sub];
}

export function applyPremiumMatchBoost(score: number, profile: Record<string, unknown>): number {
  let boosted = score + TIER_SCORE_BOOST[resolveSubscriptionType(profile)];
  if (isActiveBoost(profile)) boosted += ACTIVE_BOOST_SCORE_BONUS;
  return Math.min(100, boosted);
}

export function enrichWithPremiumBoost(
  profile: Record<string, unknown>,
  compatibilityScore: number,
): Record<string, unknown> {
  const subscriptionType = resolveSubscriptionType(profile);
  const isBoosted = isActiveBoost(profile);
  return {
    ...profile,
    subscriptionType,
    isPremium: subscriptionType !== 'Free',
    compatibilityScore,
    isBoosted,
    boostExpiresAt: isBoosted ? profile.boostExpiresAt : null,
  };
}

export function sortProfilesByListingPriority(
  profiles: Record<string, unknown>[],
): Record<string, unknown>[] {
  return [...profiles].sort((a, b) => {
    const tierDiff = getListingPriorityTier(a) - getListingPriorityTier(b);
    if (tierDiff !== 0) return tierDiff;

    const scoreDiff = (b.compatibilityScore as number) - (a.compatibilityScore as number);
    if (scoreDiff !== 0) return scoreDiff;

    const aUpdated = new Date(String(a.updatedAt || 0)).getTime();
    const bUpdated = new Date(String(b.updatedAt || 0)).getTime();
    if (bUpdated !== aUpdated) return bUpdated - aUpdated;

    return (isPremiumSubscriber(b) ? 1 : 0) - (isPremiumSubscriber(a) ? 1 : 0);
  });
}

export function getPlanById(planId: string) {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}
