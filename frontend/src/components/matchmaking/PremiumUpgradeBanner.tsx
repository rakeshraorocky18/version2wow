import { Crown, Rocket, Zap } from 'lucide-react';
import type { PremiumStatus } from '../../lib/matchmakingPremium';
import { formatBoostRemaining } from '../../lib/matchmakingPremium';

type Props = {
  premiumStatus?: PremiumStatus | null;
  onViewPlans: () => void;
  onActivateBoost: () => void;
  boostLoading?: boolean;
};

export default function PremiumUpgradeBanner({
  premiumStatus,
  onViewPlans,
  onActivateBoost,
  boostLoading = false,
}: Props) {
  const isPremium = premiumStatus?.hasActiveSubscription;
  const isBoosted = premiumStatus?.isBoosted;
  const boostRemaining = formatBoostRemaining(premiumStatus?.boostExpiresAt);

  if (isPremium && isBoosted && boostRemaining) {
    return (
      <div className="dp-premium-banner dp-premium-banner--boosted">
        <div className="dp-premium-banner__content">
          <Zap size={20} className="dp-premium-banner__icon dp-premium-banner__icon--boost" />
          <div>
            <p className="dp-premium-banner__title">Profile Boost Active</p>
            <p className="dp-premium-banner__text">
              Your profile is featured at the top of match listings · {boostRemaining}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="dp-premium-banner__btn dp-premium-banner__btn--outline"
          disabled={boostLoading}
          onClick={onActivateBoost}
        >
          {boostLoading ? 'Extending...' : 'Extend Boost'}
        </button>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="dp-premium-banner dp-premium-banner--premium">
        <div className="dp-premium-banner__content">
          <Crown size={20} className="dp-premium-banner__icon" />
          <div>
            <p className="dp-premium-banner__title">
              {premiumStatus?.subscriptionType} Member
            </p>
            <p className="dp-premium-banner__text">
              Boost your profile for 24 hours to appear at the top of Find Your Match.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="dp-premium-banner__btn"
          disabled={boostLoading}
          onClick={onActivateBoost}
        >
          <Rocket size={16} />
          {boostLoading ? 'Activating...' : 'Boost Profile'}
        </button>
      </div>
    );
  }

  return (
    <div className="dp-premium-banner">
      <div className="dp-premium-banner__content">
        <Crown size={20} className="dp-premium-banner__icon" />
        <div>
          <p className="dp-premium-banner__title">Stand out and get noticed</p>
          <p className="dp-premium-banner__text">
            Upgrade to Premium for higher visibility, a premium badge, and profile boosts.
          </p>
        </div>
      </div>
      <button type="button" className="dp-premium-banner__btn" onClick={onViewPlans}>
        View Plans
      </button>
    </div>
  );
}
