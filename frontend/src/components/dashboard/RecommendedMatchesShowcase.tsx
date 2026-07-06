import { BadgeCheck, Heart, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCard from './DashboardCard';
import type { DashboardProfileCardData } from '../../hooks/useDashboard';

interface RecommendedMatchesShowcaseProps {
  matches: DashboardProfileCardData[];
  sentInterestUserIds: Set<string>;
  connectedUserIds: Set<string>;
  onSendInterest?: (match: DashboardProfileCardData) => void;
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80';

export default function RecommendedMatchesShowcase({
  matches,
  sentInterestUserIds,
  connectedUserIds,
  onSendInterest,
}: RecommendedMatchesShowcaseProps) {
  return (
    <DashboardCard className="wow-recommended-matches" delay={5} noHover>
      <div className="dp-dash-panel-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wow-section-kicker">Recommended Matches</p>
            <h2 className="wow-section-title">Profiles worth a closer look</h2>
            <p className="wow-section-subtitle">
              Curated suggestions based on profile strength, compatibility depth, and long-term connection potential.
            </p>
          </div>
          <Link to="/app/matches?tab=suggestions" className="wow-inline-link">
            View all
          </Link>
        </div>

        {matches.length > 0 ? (
          <div className="wow-match-scroll">
            {matches.map((match) => {
              const interestSent =
                sentInterestUserIds.has(match.id) ||
                (match.userId ? sentInterestUserIds.has(match.userId) : false);
              const connected =
                connectedUserIds.has(match.id) ||
                (match.userId ? connectedUserIds.has(match.userId) : false);

              return (
                <article key={match.id} className="wow-match-mini-card">
                  <div className="wow-match-mini-card__media">
                    <img
                      src={match.photoUrl || FALLBACK_PHOTO}
                      alt={match.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C2630]/70 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-[#B76E79] backdrop-blur">
                      <Heart size={12} fill="currentColor" />
                      {match.compatibilityScore}% Compatible
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-[#2C2630]">
                            {match.name}
                            {match.age ? `, ${match.age}` : ''}
                          </h3>
                          {match.isVerified && (
                            <span className="wow-verified-pill">
                              <BadgeCheck size={12} />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-[#6B6670]">
                          {match.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={13} />
                              {match.location}
                            </span>
                          )}
                          <span>{match.profession}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {match.highlights.slice(0, 2).map((highlight) => (
                        <span key={highlight} className="wow-soft-chip">
                          {highlight}
                        </span>
                      ))}
                    </div>

                    <div className="wow-match-mini-card__breakdown">
                      {match.compatibilityInsights.slice(0, 2).map((item) => (
                        <div key={item.label} className="wow-match-mini-card__metric">
                          <span>{item.label}</span>
                          <strong>{item.score}%</strong>
                        </div>
                      ))}
                    </div>

                    <div className="wow-match-mini-card__actions">
                      <Link to={match.profilePath} className="wow-secondary-button wow-match-mini-card__button">
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => onSendInterest?.(match)}
                        disabled={interestSent || connected || !onSendInterest}
                        className="wow-primary-button wow-match-mini-card__button disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {connected ? 'Connected' : interestSent ? 'Sent' : 'Interest'}
                      </button>
                      <Link
                        to={match.chatPath || '/app/chat'}
                        aria-label={`Chat with ${match.name}`}
                        className="wow-ghost-button wow-match-mini-card__chat"
                      >
                        <MessageCircle size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="wow-empty-state">
            <p className="text-sm font-medium text-[#2C2630]">
              Complete more profile details to unlock premium match suggestions.
            </p>
            <Link to="/app/profile/edit" className="wow-inline-link mt-2 inline-flex">
              Complete profile
            </Link>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
