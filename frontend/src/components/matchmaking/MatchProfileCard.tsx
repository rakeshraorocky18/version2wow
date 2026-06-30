import { Bookmark, Heart, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPhotoUrl } from '../../lib/profileUtils';
import type { MatchProfile } from '../types/matchmaking';

type Props = {
  profile: MatchProfile;
  shortlisted?: boolean;
  interestSent?: boolean;
  onInterest: () => void;
  onShortlist: () => void;
  showScore?: boolean;
};

export default function MatchProfileCard({
  profile,
  shortlisted = false,
  interestSent = false,
  onInterest,
  onShortlist,
  showScore = true,
}: Props) {
  const navigate = useNavigate();
  const photoUrl = getPhotoUrl(profile.photos?.[0] || profile.wizardProfile?.profilePhoto || '');

  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={() => navigate(`/app/matches/${profile.id}`)}
    >
      {showScore && profile.compatibilityScore !== undefined && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-primary-600 text-white text-xs font-semibold">
          {profile.compatibilityScore}% match
        </div>
      )}

      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={`${profile.firstName} ${profile.lastName}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{profile.gender === 'female' ? '👩' : '👨'}</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900">
        {profile.firstName} {profile.lastName}
      </h3>

      <div className="mt-2 space-y-1 text-sm text-gray-600">
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
        {profile.compatibility?.highlights?.length ? (
          <p className="text-xs text-primary-700 mt-1">{profile.compatibility.highlights.slice(0, 2).join(' · ')}</p>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInterest();
          }}
          disabled={interestSent}
          className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1 disabled:opacity-60"
        >
          <Heart size={16} />
          {interestSent ? 'Interest Sent' : 'Send Interest'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShortlist();
          }}
          className={`px-3 py-2 border rounded-lg flex items-center justify-center ${
            shortlisted ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
          title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        >
          <Bookmark size={16} fill={shortlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
