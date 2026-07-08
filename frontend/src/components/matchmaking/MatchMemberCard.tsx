import { useState } from 'react';
import { Camera, CheckCircle2, UserPlus, Video } from 'lucide-react';
import { getPhotoUrl } from '../../lib/profileUtils';

type ProfileLike = {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  bio?: string;
  isVerified?: boolean;
  onlineStatus?: boolean;
  photos?: string[];
  wizardProfile?: { profilePhoto?: string; expressYourself?: { aboutMe?: string } };
  expressYourself?: { aboutMe?: string };
};

type Props = {
  profile: ProfileLike;
  interestSent?: boolean;
  onInterest?: () => void | Promise<void>;
  onClick?: () => void;
  expandableBio?: boolean;
  animationDelay?: number;
  interestLoading?: boolean;
  connectLabel?: string;
  connectError?: string | null;
  compatibilityScore?: number;
};

function formatDisplayName(profile: ProfileLike) {
  const first = profile.firstName || 'Member';
  const lastInitial = profile.lastName?.trim()?.[0];
  const age =
    profile.age ??
    (profile.dateOfBirth
      ? Math.max(0, new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear())
      : null);
  const name = lastInitial ? `${first} ${lastInitial}.` : first;
  return age ? `${name} (${age})` : name;
}

export default function MatchMemberCard({
  profile,
  interestSent = false,
  onInterest,
  onClick,
  expandableBio = false,
  animationDelay = 0,
  interestLoading = false,
  connectLabel,
  connectError,
  compatibilityScore,
}: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const photoUrl = getPhotoUrl(profile.photos?.[0] || profile.wizardProfile?.profilePhoto || '');
  const displayName = formatDisplayName(profile);
  const firstName = profile.firstName || 'this profile';
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const bio =
    profile.wizardProfile?.expressYourself?.aboutMe ||
    profile.expressYourself?.aboutMe ||
    profile.bio ||
    'Warm, family-oriented profile looking for a meaningful long-term relationship.';
  const photoCount = Math.max(profile.photos?.length || 0, photoUrl ? 1 : 0);
  const longBio = bio.length > 160;
  const isOnline = profile.onlineStatus;

  return (
    <article
      className="dp-member-card"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="dp-member-card__img-box">
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} className="dp-member-card__main-img" />
        ) : (
          <div className="dp-member-card__placeholder">
            <span>{profile.gender === 'female' ? '👩' : '👨'}</span>
          </div>
        )}
        <div className="dp-member-card__stat-box">
          <div>
            <Camera size={14} />
            {String(photoCount).padStart(2, '0')}
          </div>
          {compatibilityScore != null && compatibilityScore > 0 && (
            <div className="shaadi-match-score">
              {compatibilityScore}% Match
            </div>
          )}
          {compatibilityScore == null || compatibilityScore <= 0 ? (
            <div>
              <Video size={14} />
              00
            </div>
          ) : null}
        </div>
      </div>

      <div className="dp-member-card__info">
        <div className="dp-member-card__title-row">
          <h5 className="dp-member-card__title">{displayName}</h5>
          {profile.isVerified && <CheckCircle2 size={20} className="text-sky-500" />}
        </div>
        <div className={`dp-member-card__last-seen ${isOnline ? 'is-live' : ''}`}>
          {isOnline ? 'Live now' : 'Last seen 8h ago'}
        </div>
        <p className={`dp-member-card__bio ${!bioExpanded && expandableBio ? 'is-clamped' : ''}`}>
          {bio}
          {expandableBio && longBio && !bioExpanded && (
            <button
              type="button"
              className="dp-member-card__read-more"
              onClick={(e) => {
                e.stopPropagation();
                setBioExpanded(true);
              }}
            >
              Read More
            </button>
          )}
        </p>
        <ul className="dp-member-card__tags">
          {profile.religion && (
            <li>
              Community<span className="info">{profile.religion}</span>
            </li>
          )}
          {location && (
            <li>
              Live in<span className="info">{location}</span>
            </li>
          )}
          {profile.education && (
            <li>
              Education<span className="info">{profile.education}</span>
            </li>
          )}
          {profile.occupation && (
            <li>
              Work as<span className="info">{profile.occupation}</span>
            </li>
          )}
          {profile.maritalStatus && (
            <li>
              Relationship<span className="info">{profile.maritalStatus}</span>
            </li>
          )}
        </ul>
      </div>

      <div
        className="dp-member-card__contact"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h5>Interested in {firstName}?</h5>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void onInterest?.();
          }}
          disabled={interestSent || !onInterest || interestLoading}
          className="dp-connect-btn"
        >
          <UserPlus size={16} />
          {interestLoading
            ? 'Sending...'
            : interestSent
              ? 'Connected'
              : connectLabel || (!onInterest ? 'Unavailable' : 'Connect Now')}
        </button>
        {connectError && (
          <p className="mt-3 text-center text-xs font-medium text-red-600">{connectError}</p>
        )}
      </div>
    </article>
  );
}
