import { Link } from 'react-router-dom';
import DashboardCard from './DashboardCard';
import type { DashboardRecentMoment } from '../../hooks/useDashboard';

interface RecentInterestMomentsProps {
  moments: DashboardRecentMoment[];
}

export default function RecentInterestMoments({
  moments,
}: RecentInterestMomentsProps) {
  return (
    <DashboardCard className="wow-recent-moments-card" delay={4}>
      <div className="dp-dash-panel-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wow-section-kicker">Recent Interests</p>
            <h2 className="wow-section-title">Your social heartbeat</h2>
            <p className="wow-section-subtitle">
              Stay close to the members and moments moving your journey forward.
            </p>
          </div>
          <Link to="/app/matches?tab=interests&interest=received" className="wow-inline-link">
            View all
          </Link>
        </div>

        {moments.length > 0 ? (
          <div className="mt-4 space-y-3">
            {moments.map((moment) => (
              <Link key={moment.id} to={moment.to} className={`wow-social-moment is-${moment.accent}`}>
                <span className="wow-social-moment__emoji" aria-hidden>
                  {moment.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#2C2630]">
                    {moment.text}
                  </span>
                  <span className="mt-1 block text-xs text-[#6B6670]">{moment.time}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="wow-empty-state">
            <p className="text-sm font-medium text-[#2C2630]">Your journey is just getting started.</p>
            <p className="mt-1 text-sm text-[#6B6670]">
              Browse profiles and send an interest to begin building your first connection.
            </p>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
