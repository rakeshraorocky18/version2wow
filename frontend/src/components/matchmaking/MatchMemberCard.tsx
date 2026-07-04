import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  Crown,
  Flag,
  Heart,
  MessageCircle,
  Star,
  UserPlus,
  Zap,
} from 'lucide-react';
import type { InterestStatus } from '../../lib/matchInterestUtils';
import { shouldShowInterestPrompt } from '../../lib/matchInterestUtils';
import {
  collectProfilePhotos,
  estimateProfileCompletion,
  formatLastActive,
} from '../../lib/matchCardUtils';
import {
  getSubscriptionLabel,
  isBoostedMatchProfile,
  isPremiumMatchProfile,
} from '../../lib/matchmakingPremium';
import ProfilePhotoCarousel from './ProfilePhotoCarousel';

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
  religion?: string;
  bio?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  isBoosted?: boolean;
  subscriptionType?: string;
  boostExpiresAt?: string | null;
  onlineStatus?: boolean;
  isComplete?: boolean;
  updatedAt?: string;
  photos?: string[];
  profilePhoto?: string;
  wizardProfile?: { profilePhoto?: string; expressYourself?: { aboutMe?: string } };
  expressYourself?: { aboutMe?: string };
};

type Props = {
  profile: ProfileLike;
  interestStatus?: InterestStatus;
  partnerUserId?: string;
  onInterest?: () => void | Promise<void>;
  onShortlist?: () => void | Promise<void>;
  onMessage?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  isShortlisted?: boolean;
  onClick?: () => void;
  expandableBio?: boolean;
  animationDelay?: number;
  interestLoading?: boolean;
  shortlistLoading?: boolean;
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
  interestStatus = 'none',
  partnerUserId,
  onInterest,
  onShortlist,
  onMessage,
  onBlock,
  onReport,
  isShortlisted = false,
  onClick,
  expandableBio = false,
  animationDelay = 0,
  interestLoading = false,
  shortlistLoading = false,
  connectLabel,
  connectError,
  compatibilityScore,
}: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  const photos = collectProfilePhotos(profile);
  const displayName = formatDisplayName(profile);
  const firstName = profile.firstName || 'this profile';
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const bio =
    profile.wizardProfile?.expressYourself?.aboutMe ||
    profile.expressYourself?.aboutMe ||
    profile.bio ||
    'Warm, family-oriented profile looking for a meaningful long-term relationship.';
  const longBio = bio.length > 160;
  const completion = estimateProfileCompletion(profile);
  const lastActive = formatLastActive(profile.onlineStatus, profile.updatedAt);

  const chatUserId = partnerUserId || profile.userId;
  const showConnect = shouldShowInterestPrompt(interestStatus) && !!onInterest;
  const showMatched = interestStatus === 'accepted';
  const showSentNotice = interestStatus === 'pending_sent';
  const showReceivedNotice = interestStatus === 'pending_received';
  const showBoosted = isBoostedMatchProfile(profile);
  const showPremium = isPremiumMatchProfile(profile);
  const subscriptionLabel = getSubscriptionLabel(
    profile.subscriptionType as 'Basic' | 'Premium' | 'Platinum' | 'Free',
  );
  const canMessage = showMatched && !!chatUserId;

  const cardClasses = [
    'dp-member-card',
    showMatched ? 'dp-member-card--matched' : '',
    showBoosted ? 'dp-member-card--boosted' : '',
    showPremium && !showBoosted ? 'dp-member-card--premium' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleInterest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartPulse(true);
    window.setTimeout(() => setHeartPulse(false), 600);
    await onInterest?.();
  };

  return (
    <article
      className={cardClasses}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="dp-member-card__img-box">
        <ProfilePhotoCarousel photos={photos} alt={displayName} gender={profile.gender} />

        {showMatched && <span className="dp-member-card__matched-ribbon">Matched</span>}
        {showBoosted && !showMatched && (
          <span className="dp-member-card__boosted-ribbon">
            <Zap size={12} />
            Boosted
          </span>
        )}
        {showPremium && !showMatched && (
          <span className={`dp-member-card__premium-ribbon${showBoosted ? ' is-stacked' : ''}`}>
            <Crown size={12} />
            {subscriptionLabel || 'Premium'}
          </span>
        )}

        <div className="dp-member-card__badge-row">
          {profile.isVerified && (
            <span className="dp-badge dp-badge--verified">
              <CheckCircle2 size={12} />
              Verified
            </span>
          )}
          {compatibilityScore != null && compatibilityScore > 0 && (
            <span className="dp-badge dp-badge--match">{compatibilityScore}% Match</span>
          )}
          {completion >= 50 && (
            <span className="dp-badge dp-badge--completion">{completion}% Complete</span>
          )}
        </div>
      </div>

      <div className="dp-member-card__info">
        <div className="dp-member-card__title-row">
          <h5 className="dp-member-card__title">{displayName}</h5>
          {showPremium && (
            <span className="dp-member-card__premium-badge" title={`${subscriptionLabel || 'Premium'} member`}>
              <Crown size={14} />
            </span>
          )}
        </div>

        <div className={`dp-member-card__last-seen${profile.onlineStatus ? ' is-live' : ''}`}>
          {lastActive}
        </div>

        <p className={`dp-member-card__bio${!bioExpanded && expandableBio ? ' is-clamped' : ''}`}>
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

        <div className="dp-quick-actions" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {onInterest && interestStatus === 'none' && (
            <button
              type="button"
              className={`dp-quick-actions__btn${heartPulse ? ' is-pulse' : ''}`}
              title="Send interest"
              disabled={interestLoading}
              onClick={(e) => void handleInterest(e)}
            >
              <Heart size={16} />
            </button>
          )}
          {onShortlist && (
            <button
              type="button"
              className={`dp-quick-actions__btn${isShortlisted ? ' is-active' : ''}`}
              title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              disabled={shortlistLoading}
              onClick={(e) => {
                e.stopPropagation();
                void onShortlist();
              }}
            >
              <Star size={16} />
            </button>
          )}
          {canMessage ? (
            <Link
              to={`/app/chat?userId=${chatUserId}`}
              className="dp-quick-actions__btn"
              title="Message"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle size={16} />
            </Link>
          ) : onMessage ? (
            <button type="button" className="dp-quick-actions__btn" title="Message" onClick={onMessage}>
              <MessageCircle size={16} />
            </button>
          ) : null}
          {onBlock && (
            <button type="button" className="dp-quick-actions__btn" title="Block" onClick={onBlock}>
              <Ban size={16} />
            </button>
          )}
          {onReport && (
            <button type="button" className="dp-quick-actions__btn" title="Report" onClick={onReport}>
              <Flag size={16} />
            </button>
          )}
        </div>
      </div>

      {showMatched && chatUserId && (
        <div className="dp-member-card__matched" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="dp-matched-badge">
            <CheckCircle2 size={18} />
            <span>Matched</span>
          </div>
          <p className="dp-matched-text">You&apos;re connected. Start a conversation!</p>
          <Link to={`/app/chat?userId=${chatUserId}`} className="dp-chat-btn">
            <MessageCircle size={16} />
            Start Chat
          </Link>
        </div>
      )}

      {showSentNotice && (
        <div className="dp-member-card__notice" onClick={(e) => e.stopPropagation()}>
          <p>Interest sent · awaiting response</p>
        </div>
      )}

      {showReceivedNotice && (
        <div className="dp-member-card__notice" onClick={(e) => e.stopPropagation()}>
          <Link to="/app/matches?tab=interests&interest=received">
            They&apos;re interested in you — respond →
          </Link>
        </div>
      )}

      {showConnect && (
        <div className="dp-member-card__contact" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <h5>Interested in {firstName}?</h5>
          <button
            type="button"
            onClick={(e) => void handleInterest(e)}
            disabled={interestLoading}
            className={`dp-connect-btn${heartPulse ? ' is-pulse' : ''}`}
          >
            <UserPlus size={16} />
            {interestLoading ? 'Sending...' : connectLabel || 'Connect Now'}
          </button>
          {connectError && (
            <p className="mt-3 text-center text-xs font-medium text-red-600">{connectError}</p>
          )}
        </div>
      )}
    </article>
  );
}
