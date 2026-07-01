import { Heart, MapPin, CheckCircle2, Crown, Star, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPhotoUrl } from '../../lib/profileUtils';
import type { MatchProfile } from '../../types/matchmaking';

type Props = {
  profile: MatchProfile;
  interestSent?: boolean;
  shortlisted?: boolean;
  onInterest: () => void;
  onShortlist?: () => void;
  showScore?: boolean;
};

export default function MatchProfileCard({
  profile,
  interestSent = false,
  shortlisted = false,
  onInterest,
  onShortlist,
  showScore = true,
}: Props) {
  const navigate = useNavigate();
  const photoUrl = getPhotoUrl(profile.photos?.[0] || profile.wizardProfile?.profilePhoto || '');
  const age =
    profile.age ??
    (profile.dateOfBirth
      ? Math.max(0, new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear())
      : null);
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <article
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#F0DFE7] bg-gradient-to-b from-white to-[#FFFBFC] shadow-[0_4px_20px_rgba(182,106,138,0.07)] transition duration-300 hover:-translate-y-0.5 hover:border-[#E8C8D8] hover:shadow-[0_16px_40px_rgba(182,106,138,0.16)]"
      onClick={() => navigate(`/app/matches/${profile.id}`)}
    >
      <div className="relative h-52 shrink-0 overflow-hidden bg-gradient-to-br from-[#FCE8EF] via-[#F9DEE7] to-[#F3EEFF]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-80">{profile.gender === 'female' ? '👩' : '👨'}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#3D1F30]/80 via-[#3D1F30]/20 to-transparent" />

        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          {showScore && profile.compatibilityScore !== undefined ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#B66A8A] shadow-sm backdrop-blur-sm">
              <Heart size={11} fill="currentColor" />
              {profile.compatibilityScore}% match
            </span>
          ) : (
            <span />
          )}
          {onShortlist && (
            <button
              type="button"
              aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              onClick={(e) => {
                e.stopPropagation();
                onShortlist();
              }}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition ${
                shortlisted
                  ? 'bg-amber-400 text-white hover:bg-amber-500'
                  : 'bg-white/95 text-[#9A5776] hover:bg-white hover:text-amber-500'
              }`}
            >
              <Star size={16} fill={shortlisted ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5 pt-10">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display truncate text-lg font-bold text-white drop-shadow-sm">
              {fullName}
            </h3>
            {profile.isVerified && (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-300" aria-label="Verified" />
            )}
            {profile.isPremium && (
              <Crown size={16} className="shrink-0 text-amber-300" aria-label="Premium" />
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3.5">
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          <li className="flex items-center gap-2.5 rounded-xl bg-[#FFF5F8] px-3 py-2 text-[#5D2B44]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#B66A8A] shadow-sm">
              <Calendar size={14} />
            </span>
            <span className="font-medium">{age != null ? `${age} yrs` : '—'}</span>
          </li>
          <li className="flex items-center gap-2.5 rounded-xl bg-[#FFF5F8] px-3 py-2 text-[#5D2B44]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#B66A8A] shadow-sm">
              <BookOpen size={14} />
            </span>
            <span className="truncate font-medium">{profile.religion || '—'}</span>
          </li>
          <li className="flex items-center gap-2.5 rounded-xl bg-[#FFF5F8] px-3 py-2 text-[#5D2B44]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#B66A8A] shadow-sm">
              <MapPin size={14} />
            </span>
            <span className="truncate font-medium">{location || '—'}</span>
          </li>
        </ul>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInterest();
          }}
          disabled={interestSent}
          className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#B66A8A] to-[#C07AA0] py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(182,106,138,0.35)] transition hover:from-[#A75878] hover:to-[#B06A90] hover:shadow-[0_6px_18px_rgba(182,106,138,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Heart size={16} fill={interestSent ? 'currentColor' : 'none'} />
          {interestSent ? 'Interested' : 'Send Interest'}
        </button>
      </div>
    </article>
  );
}
