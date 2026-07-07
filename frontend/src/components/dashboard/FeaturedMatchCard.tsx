import { useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCard from './DashboardCard';
import type { DashboardProfileCardData } from '../../hooks/useDashboard';

interface FeaturedMatchCardProps {
  matches: DashboardProfileCardData[];
  onSendInterest?: (match: DashboardProfileCardData) => void;
  sentInterestUserIds: Set<string>;
  connectedUserIds: Set<string>;
}

const FALLBACK_MATCH: DashboardProfileCardData = {
  id: 'featured-fallback',
  name: 'Ananya Sharma',
  firstName: 'Ananya',
  age: 27,
  city: 'Bangalore',
  location: 'Bangalore',
  profession: 'Brand Strategist',
  compatibilityScore: 92,
  photoUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  isVerified: true,
  highlights: ['Travel', 'Music', 'Fitness', 'Family Values'],
  compatibilityInsights: [
    { label: 'Family Values', score: 95 },
    { label: 'Lifestyle', score: 90 },
    { label: 'Religion/Culture', score: 88 },
    { label: 'Career Alignment', score: 92 },
  ],
  profilePath: '/app/matches',
  chatPath: '/app/chat',
};

export default function FeaturedMatchCard({
  matches,
  onSendInterest,
  sentInterestUserIds,
  connectedUserIds,
}: FeaturedMatchCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const curatedMatches = matches.length > 0 ? matches : [FALLBACK_MATCH];
  const profile = curatedMatches[activeIndex] ?? curatedMatches[0];
  const isFallback = matches.length === 0;
  const interestSent =
    sentInterestUserIds.has(profile.id) ||
    (profile.userId ? sentInterestUserIds.has(profile.userId) : false);
  const connected =
    connectedUserIds.has(profile.id) ||
    (profile.userId ? connectedUserIds.has(profile.userId) : false);
  const interestDisabled = isFallback || interestSent || connected;
  const whyRecommended = profile.highlights.slice(0, 4);

  return (
    <DashboardCard className="wow-featured-match-card" delay={1} noHover>
      <div className="wow-featured-match-card__media">
        <img
          src={profile.photoUrl || FALLBACK_MATCH.photoUrl}
          alt={profile.name}
          className="h-full w-full object-cover"
        />
        <div className="wow-featured-match-card__overlay" />
        <div className="wow-featured-match-card__badge">
          <Sparkles size={14} />
          Featured Match
        </div>
        {curatedMatches.length > 1 && (
          <div className="wow-featured-match-card__nav">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((current) =>
                  current === 0 ? curatedMatches.length - 1 : current - 1,
                )
              }
              className="wow-featured-match-card__arrow"
              aria-label="Previous featured match"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((current) =>
                  current === curatedMatches.length - 1 ? 0 : current + 1,
                )
              }
              className="wow-featured-match-card__arrow"
              aria-label="Next featured match"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <div className="wow-featured-match-card__compatibility">
          <Heart size={14} fill="currentColor" />
          {profile.compatibilityScore}% Match
        </div>
      </div>

      <div className="wow-featured-match-card__body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[1.1rem] font-semibold text-[#2C2630]">
                {profile.name}
                {profile.age ? `, ${profile.age}` : ''}
              </h2>
              {profile.isVerified && (
                <span className="wow-verified-pill">
                  <BadgeCheck size={13} />
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-[#6B6670]">
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} />
                  {profile.location}
                </span>
              )}
              <span>{profile.profession}</span>
            </div>
          </div>
          <div className="wow-featured-match-score-ring">
            <span>{profile.compatibilityScore}%</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="wow-section-kicker">Shared Signals</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.highlights.slice(0, 4).map((highlight) => (
              <span key={highlight} className="wow-soft-chip">
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="wow-featured-match-card__insights">
          {profile.compatibilityInsights.slice(0, 4).map((item) => (
            <div key={item.label} className="wow-featured-match-card__insight">
              <span>{item.label}</span>
              <strong>{item.score}%</strong>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="wow-section-kicker">Why We Recommended This Match</p>
          <ul className="wow-featured-match-card__reasons">
            {whyRecommended.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link to={profile.profilePath} className="wow-secondary-button text-center">
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              if (!isFallback && onSendInterest && !interestDisabled) onSendInterest(profile);
            }}
            disabled={!onSendInterest || interestDisabled}
            className="wow-primary-button disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connected ? 'Connected' : interestSent ? 'Interest Sent' : 'Send Interest'}
          </button>
          <Link
            to={profile.chatPath || '/app/chat'}
            className="wow-ghost-button inline-flex items-center justify-center gap-2"
          >
            <MessageCircle size={14} />
            Start Chat
          </Link>
        </div>

        {curatedMatches.length > 1 && (
          <div className="wow-featured-match-card__dots">
            {curatedMatches.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={index === activeIndex ? 'is-active' : ''}
                aria-label={`Show featured match ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
