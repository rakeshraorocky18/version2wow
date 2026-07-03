import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Calendar, Heart, MapPin, Search, User } from 'lucide-react';
import CircularProgressRing from './CircularProgressRing';

interface DashboardHeroProps {
  userName: string;
  userPhoto?: string;
  profileCompletion: number;
  isVerified?: boolean;
  profession?: string;
  location?: string;
  planningPercent: number;
  daysUntilWedding: number;
  nextTask: string;
  pendingInterests: number;
  mutualMatches: number;
}

export default function DashboardHero({
  userName,
  userPhoto,
  profileCompletion,
  isVerified,
  profession,
  location,
  planningPercent,
  daysUntilWedding,
  nextTask,
  pendingInterests,
  mutualMatches,
}: DashboardHeroProps) {
  const matchStatus =
    pendingInterests > 0 && mutualMatches > 0
      ? `${mutualMatches} mutual · ${pendingInterests} pending`
      : pendingInterests > 0
        ? `${pendingInterests} interest${pendingInterests > 1 ? 's' : ''} awaiting`
        : mutualMatches > 0
          ? `${mutualMatches} mutual match${mutualMatches > 1 ? 'es' : ''}`
          : 'Explore new connections';

  return (
      <section className="dp-dash-hero">
      <div className="dp-dash-hero__bg" aria-hidden>
        <img src="/images/matches-hero-bg.png" alt="" />
      </div>
      <div className="dp-dash-hero__inner">
        <p className="shaadi-my-label">My WOW</p>

        <div className="dp-dash-hero__profile">
          <div className="shaadi-avatar-ring">
            <CircularProgressRing
              percent={profileCompletion}
              size={76}
              strokeWidth={4}
              gradientId="shaadiProgressGrad"
            />
            <div className="shaadi-avatar-ring__inner">
              {userPhoto ? (
                <img src={userPhoto} alt={userName} className="dp-dash-hero__avatar !m-0 !shadow-none" />
              ) : (
                <div className="dp-dash-hero__avatar dp-dash-hero__avatar--placeholder !m-0 !shadow-none">
                  <User size={24} className="text-[#e52727]" />
                </div>
              )}
            </div>
            <span className="shaadi-avatar-ring__badge">{profileCompletion}%</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="dp-dash-hero__title !text-xl sm:!text-2xl">
                Welcome, <span>{userName}</span>
              </h1>
              {isVerified && (
                <span className="shaadi-verified-badge" title="Verified profile">
                  <BadgeCheck size={14} /> Verified
                </span>
              )}
            </div>
            {(profession || location) && (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[#535a60]">
                {profession && <span>{profession}</span>}
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-[#e52727]" />
                    {location}
                  </span>
                )}
              </p>
            )}
            <p className="dp-dash-hero__subtitle !mt-1">
              Planning your perfect journey together.
            </p>
            <Link to="/app/profile/edit" className="shaadi-edit-link mt-1 inline-flex">
              Edit Profile →
            </Link>
          </div>
        </div>

        <div className="dp-dash-hero__stats">
          <div className="dp-dash-hero__stat">
            <p className="dp-dash-hero__stat-label">Planning progress</p>
            <p className="dp-dash-hero__stat-value is-brand">{planningPercent}%</p>
          </div>
          <div className="dp-dash-hero__stat">
            <p className="dp-dash-hero__stat-label">Wedding countdown</p>
            <p className="dp-dash-hero__stat-value">
              {daysUntilWedding}{' '}
              <span className="text-sm font-semibold text-[#6a737c]">days</span>
            </p>
          </div>
          <div className="dp-dash-hero__stat">
            <p className="dp-dash-hero__stat-label">Next pending task</p>
            <p className="dp-dash-hero__stat-value text-sm leading-snug">{nextTask}</p>
          </div>
          <div className="dp-dash-hero__stat">
            <p className="dp-dash-hero__stat-label">Partner match status</p>
            <p className="dp-dash-hero__stat-value is-brand flex items-center gap-1 text-sm">
              <Heart size={12} fill="currentColor" />
              {matchStatus}
            </p>
          </div>
        </div>

        <div className="dp-dash-hero__actions">
          <Link to="/app/matches" className="dp-dash-btn dp-dash-btn--primary">
            <Search size={14} /> View Matches <ArrowRight size={14} />
          </Link>
          <Link to="/app/planner" className="dp-dash-btn dp-dash-btn--outline">
            <Calendar size={14} /> Wedding Planner
          </Link>
        </div>
      </div>
    </section>
  );
}
