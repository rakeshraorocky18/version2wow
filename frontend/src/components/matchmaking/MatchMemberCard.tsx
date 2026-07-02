import { useState } from 'react';
import {
  Briefcase,
  Camera,
  CheckCircle2,
  GraduationCap,
  MapPin,
  UserPlus,
  Video,
} from 'lucide-react';
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
  onInterest?: () => void;
  onClick?: () => void;
  expandableBio?: boolean;
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

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#F3F3F3] px-3 py-1.5 text-xs text-[#999999]">
      {label} <strong className="ml-1 font-bold text-[#222222]">{value}</strong>
    </span>
  );
}

export default function MatchMemberCard({
  profile,
  interestSent = false,
  onInterest,
  onClick,
  expandableBio = false,
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

  return (
    <div
      className={`grid gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-[0_8px_28px_rgba(0,0,0,0.06)] sm:grid-cols-[220px_1fr] sm:p-4 lg:grid-cols-[220px_1fr_220px] ${onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)]' : ''}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#F9DEE7] to-[#F6E8FF] sm:h-full sm:min-h-[230px]">
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl">{profile.gender === 'female' ? '👩' : '👨'}</span>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
            <Camera size={12} /> {String(photoCount).padStart(2, '0')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
            <Video size={12} /> 00
          </span>
        </div>
      </div>

      <div className="min-w-0 py-1 sm:py-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-2xl font-bold text-[#f82f71]">{displayName}</h3>
          {profile.isVerified && <CheckCircle2 size={18} className="text-sky-500" />}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {profile.onlineStatus ? 'Online now' : 'Last seen 8h ago'}
        </p>

        <p className={`mt-3 max-w-2xl text-sm leading-relaxed text-[#666666] ${!bioExpanded && expandableBio ? 'line-clamp-3' : ''}`}>
          {bio}
          {expandableBio && longBio && !bioExpanded && (
            <button
              type="button"
              className="ml-1 font-semibold text-[#f82f71] hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setBioExpanded(true);
              }}
            >
              Read More
            </button>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {location && <Tag label="Live in" value={location} />}
          {profile.education && <Tag label="Education" value={profile.education} />}
          {profile.occupation && <Tag label="Work as" value={profile.occupation} />}
          {profile.maritalStatus && <Tag label="Relationship" value={profile.maritalStatus} />}
        </div>
      </div>

      <div
        className="flex flex-col justify-center border-[#EEEEEE] p-4 lg:border-l lg:p-5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="text-center text-sm font-bold text-[#222222] lg:text-left">
          Interested in {firstName}?
        </p>
        <button
          type="button"
          onClick={onInterest}
          disabled={interestSent || !onInterest}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f82f71] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e62866] disabled:opacity-60"
        >
          <UserPlus size={16} />
          {interestSent ? 'Connected' : 'Connect Now'}
        </button>
      </div>
    </div>
  );
}
