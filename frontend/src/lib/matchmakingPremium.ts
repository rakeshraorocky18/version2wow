export type SubscriptionType = 'Free' | 'Basic' | 'Premium' | 'Platinum';

export interface SubscriptionPlan {
  id: string;
  name: string;
  subscriptionType: SubscriptionType;
  price: number;
  currency: string;
  durationDays: number;
  scoreBoost: number;
  popular?: boolean;
  benefits: string[];
}

export interface PremiumStatus {
  subscriptionType: SubscriptionType;
  isPremium: boolean;
  isBoosted: boolean;
  boostExpiresAt: string | null;
  hasActiveSubscription: boolean;
  paymentIntegrationEnabled: boolean;
  benefits: {
    boostedProfile: boolean;
    priorityInMatchListings: boolean;
    profileBoost: boolean;
  };
}

export function hasActivePremiumSubscription(
  status?: PremiumStatus | null,
  profile?: { isPremium?: boolean | null; subscriptionType?: SubscriptionType | null },
): boolean {
  if (status?.hasActiveSubscription) return true;
  if (profile?.subscriptionType && profile.subscriptionType !== 'Free') return true;
  return profile?.isPremium === true;
}

export function isBoostedMatchProfile(profile: {
  isBoosted?: boolean | null;
  boostExpiresAt?: string | null;
}): boolean {
  if (profile.isBoosted === true) return true;
  if (!profile.boostExpiresAt) return false;
  return new Date(profile.boostExpiresAt).getTime() > Date.now();
}

export function isPremiumMatchProfile(profile: {
  isPremium?: boolean | null;
  subscriptionType?: SubscriptionType | string | null;
}): boolean {
  const sub = profile.subscriptionType;
  if (sub && sub !== 'Free') return true;
  return profile.isPremium === true;
}

export function getSubscriptionLabel(subscriptionType?: SubscriptionType | string | null): string {
  if (!subscriptionType || subscriptionType === 'Free') return '';
  return subscriptionType;
}

export function formatBoostRemaining(boostExpiresAt?: string | null): string | null {
  if (!boostExpiresAt) return null;
  const ms = new Date(boostExpiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export const PREMIUM_BENEFITS = {
  boostedProfile: 'Your profile ranks higher in Suggested & Search',
  priorityListing: 'Premium badge and boosted visibility',
  profileBoost: '24-hour spotlight at the top of match listings',
} as const;
