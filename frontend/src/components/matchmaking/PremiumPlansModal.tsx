import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Crown, Sparkles, X, Zap } from 'lucide-react';
import type { SubscriptionPlan } from '../../lib/matchmakingPremium';
import { usePremiumActions, usePremiumPlans } from '../../hooks/useMatchmaking';

type Props = {
  open: boolean;
  onClose: () => void;
  currentPlan?: string;
};

export default function PremiumPlansModal({ open, onClose, currentPlan = 'Free' }: Props) {
  const { data } = usePremiumPlans();
  const { subscribeToPlan } = usePremiumActions();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  if (!open) return null;

  const plans = data?.plans ?? [];

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);
    try {
      await subscribeToPlan.mutateAsync(plan.id);
      toast.success(`Welcome to ${plan.name}! Your profile is now premium.`);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not activate plan');
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <div className="dp-premium-modal" role="dialog" aria-modal="true" aria-labelledby="premium-plans-title">
      <button type="button" className="dp-premium-modal__backdrop" onClick={onClose} aria-label="Close" />
      <div className="dp-premium-modal__panel">
        <button type="button" className="dp-premium-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="dp-premium-modal__header">
          <div className="dp-premium-modal__icon">
            <Crown size={28} />
          </div>
          <h2 id="premium-plans-title">Upgrade Your Match Experience</h2>
          <p>Get more visibility, priority listings, and connect faster with the right match.</p>
        </div>

        <div className="dp-premium-plans">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.subscriptionType;
            const isPopular = plan.popular;
            return (
              <article
                key={plan.id}
                className={`dp-premium-plan${isPopular ? ' dp-premium-plan--popular' : ''}${isCurrent ? ' dp-premium-plan--current' : ''}`}
              >
                {isPopular && <span className="dp-premium-plan__tag">Most Popular</span>}
                <h3>{plan.name}</h3>
                <div className="dp-premium-plan__price">
                  <span>₹{plan.price}</span>
                  <small>/{plan.durationDays} days</small>
                </div>
                <ul>
                  {plan.benefits.map((benefit) => (
                    <li key={benefit}>
                      <Check size={14} />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="dp-premium-plan__btn"
                  disabled={isCurrent || subscribeToPlan.isPending}
                  onClick={() => void handleSubscribe(plan)}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : subscribeToPlan.isPending && selectedPlan === plan.id
                      ? 'Activating...'
                      : `Choose ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>

        <p className="dp-premium-modal__note">
          <Sparkles size={14} />
          Payment integration coming soon — plans activate instantly in dev mode.
        </p>
      </div>
    </div>
  );
}
