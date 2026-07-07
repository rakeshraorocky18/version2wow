import { Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCard from './DashboardCard';

const features = [
  'See profile visitors',
  'Advanced compatibility reports',
  'Unlimited interests',
  'Priority visibility',
  'AI Match Advisor',
];

export default function PremiumUpgradeCard() {
  return (
    <DashboardCard className="wow-premium-card" delay={6}>
      <div className="dp-dash-panel-body">
        <p className="wow-section-kicker inline-flex items-center gap-2">
          <Crown size={13} />
          WOW Premium
        </p>
        <h2 className="wow-section-title">Unlock a more powerful matchmaking experience</h2>
        <p className="wow-section-subtitle">
          Get deeper visibility, richer compatibility guidance, and more ways to stand out to the
          right life partner.
        </p>

        <div className="wow-premium-card__list">
          {features.map((feature) => (
            <div key={feature} className="wow-premium-card__item">
              <Sparkles size={14} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <Link to="/app/profile" className="wow-primary-button mt-5 inline-flex">
          Upgrade Now
        </Link>
      </div>
    </DashboardCard>
  );
}
