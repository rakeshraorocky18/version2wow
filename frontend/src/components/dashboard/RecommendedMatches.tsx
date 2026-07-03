import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { MatchProfile } from '../../types/matchmaking';
import MatchProfileCard from '../matchmaking/MatchProfileCard';
import DashboardCard from './DashboardCard';

interface RecommendedMatchesProps {
  profiles: MatchProfile[];
  onSendInterest: (profile: MatchProfile) => void | Promise<void>;
  acceptedUserIds: Set<string>;
  interestLoadingId?: string | null;
}

export default function RecommendedMatches({
  profiles,
  onSendInterest,
  interestLoadingId,
}: RecommendedMatchesProps) {
  return (
    <DashboardCard delay={3}>
      <div className="dp-dash-panel-body">
        <div className="dp-dash-section-header">
          <div>
            <p className="shaadi-section-eyebrow">Recommended for you</p>
            <h2 className="dp-dash-section-title !mb-0">Matches For You</h2>
            <p className="dp-dash-section-subtitle !mb-0">
              Profiles aligned with your partner preferences
            </p>
          </div>
          <Link to="/app/matches?tab=suggestions" className="dp-dash-link">
            View all →
          </Link>
        </div>

        {profiles.length > 0 ? (
          <div className="space-y-0">
            {profiles.map((profile, i) => (
              <MatchProfileCard
                key={profile.id}
                profile={profile}
                showScore
                animationDelay={i * 80}
                interestLoading={interestLoadingId === profile.id}
                onInterest={() => onSendInterest(profile)}
              />
            ))}
          </div>
        ) : (
          <div className="dp-empty-state !py-12">
            <Sparkles size={32} className="mx-auto mb-3 text-[#e52727]" />
            <p className="dp-empty-state__title !text-base">
              Add partner preferences to receive personalised match recommendations
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link to="/app/profile/edit" className="shaadi-btn shaadi-btn--primary inline-flex">
                Complete Profile
              </Link>
              <Link
                to="/app/profile/edit?section=partner-preferences"
                className="shaadi-btn shaadi-btn--outline inline-flex"
              >
                Set Preferences
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
