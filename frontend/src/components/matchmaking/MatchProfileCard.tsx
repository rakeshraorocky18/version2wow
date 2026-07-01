import { Heart, MapPin, Briefcase, GraduationCap, CheckCircle2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPhotoUrl } from '../../lib/profileUtils';
import type { MatchProfile } from '../../types/matchmaking';

type Props = {
  profile: MatchProfile;
  interestSent?: boolean;
  onInterest: () => void;
  showScore?: boolean;
};

export default function MatchProfileCard({
  profile,
  interestSent = false,
  onInterest,
  showScore = true,
}: Props) {
  const navigate = useNavigate();
  const photoUrl = getPhotoUrl(profile.photos?.[0] || profile.wizardProfile?.profilePhoto || '');
  const age =
    profile.age ??
    (profile.dateOfBirth
      ? Math.max(
          0,
          new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear(),
        )
      : null);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[#F0DFE7] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(180,105,140,0.18)] cursor-pointer"
      onClick={() => navigate(`/app/matches/${profile.id}`)}
    >
      {showScore && profile.compatibilityScore !== undefined && (
        <div className="absolute top-4 right-4 z-10 rounded-full bg-gradient-to-r from-[#B66A8A] to-[#C07AA0] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
          {profile.compatibilityScore}% match
        </div>
      )}

      <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#F9DEE7] to-[#F6E8FF]">
        {photoUrl ? (
          <img src={photoUrl} alt={`${profile.firstName} ${profile.lastName}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{profile.gender === 'female' ? '👩' : '👨'}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <h3 className="font-display text-lg font-semibold text-[#523045]">
          {profile.firstName} {profile.lastName}
        </h3>
        {profile.isVerified && <CheckCircle2 size={16} className="text-green-600" />}
        {profile.isPremium && <Crown size={16} className="text-amber-500" />}
        {profile.onlineStatus && <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Online</span>}
      </div>

      <div className="mt-2 space-y-1 text-sm text-[#7C6673]">
        {(age || profile.height) && (
          <p>{[age ? `${age} yrs` : null, profile.height ? `${profile.height} ft` : null].filter(Boolean).join(' · ')}</p>
        )}
        {(profile.religion || profile.caste) && (
          <p>{[profile.religion, profile.caste].filter(Boolean).join(' · ')}</p>
        )}
        {profile.maritalStatus && <p>{profile.maritalStatus}</p>}
        {profile.city && (
          <p className="flex items-center gap-1">
            <MapPin size={14} /> {[profile.city, profile.state].filter(Boolean).join(', ')}
          </p>
        )}
        {profile.occupation && (
          <p className="flex items-center gap-1">
            <Briefcase size={14} /> {profile.occupation}
          </p>
        )}
        {profile.education && (
          <p className="flex items-center gap-1">
            <GraduationCap size={14} /> {profile.education}
          </p>
        )}
        {profile.bio && <p className="line-clamp-2 text-xs text-gray-500">{profile.bio}</p>}
        {profile.compatibility?.highlights?.length ? (
          <p className="mt-1 text-xs text-[#A86584]">{profile.compatibility.highlights.slice(0, 2).join(' · ')}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInterest();
          }}
          disabled={interestSent}
          className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#B66A8A] to-[#C07AA0] py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-[#A75878] hover:to-[#B06A90] disabled:opacity-60"
        >
          <Heart size={16} />
          {interestSent ? 'Interested' : 'Interest'}
        </button>
      </div>
    </div>
  );
}
