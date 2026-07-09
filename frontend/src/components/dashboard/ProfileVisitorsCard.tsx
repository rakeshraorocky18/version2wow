import { Link } from 'react-router-dom';
import { Eye, TrendingUp } from 'lucide-react';
import DashboardCard from './DashboardCard';
import type { DashboardVisitor } from '../../hooks/useDashboard';

interface ProfileVisitorsCardProps {
  viewsCount: number;
  growthPercent: number;
  visitors: DashboardVisitor[];
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80';

export default function ProfileVisitorsCard({
  viewsCount,
  growthPercent,
  visitors,
}: ProfileVisitorsCardProps) {
  return (
    <DashboardCard className="wow-visitors-card" delay={5}>
      <div className="dp-dash-panel-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wow-section-kicker">Who Viewed You</p>
            <h2 className="wow-section-title">Fresh attention on your profile</h2>
          </div>
          <Link to="/app/profile" className="wow-inline-link">
            View all
          </Link>
        </div>

        <div className="wow-visitors-card__stat">
          <div className="wow-visitors-card__icon">
            <Eye size={18} />
          </div>
          <div>
            <p className="wow-visitors-card__value">{viewsCount} Profile Visits</p>
            <p className="wow-visitors-card__growth">
              <TrendingUp size={14} />
              +{growthPercent}% growth
            </p>
          </div>
        </div>

        <div className="wow-visitors-card__stack">
          {visitors.slice(0, 5).map((visitor) => (
            <img
              key={visitor.id}
              src={visitor.photoUrl || FALLBACK_PHOTO}
              alt={visitor.name}
              className="wow-visitors-card__avatar"
            />
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {visitors.slice(0, 3).map((visitor) => (
            <Link
              key={visitor.id}
              to={visitor.profilePath}
              className="wow-visitors-card__item"
            >
              <img
                src={visitor.photoUrl || FALLBACK_PHOTO}
                alt={visitor.name}
                className="wow-visitors-card__avatar wow-visitors-card__avatar--row"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#2C2630]">
                  {visitor.name}
                </span>
                <span className="mt-1 block text-xs text-[#6B6670]">
                  {visitor.timeLabel}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
