import { Link } from 'react-router-dom';
import { Eye, MessageCircle, MapPin, Briefcase } from 'lucide-react';
import { getMainProfilePhoto, getPhotoUrl } from '../../lib/profileUtils';
import type { MatchInterest } from '../../types/matchmaking';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-gray-100 text-gray-600 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
};

function ageFromDob(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : null;
}

type Props = {
  match: MatchInterest;
  variant: 'received' | 'sent';
  onAccept?: () => void;
  onReject?: () => void;
  compact?: boolean;
  actionLoading?: boolean;
};

export default function InterestRequestCard({
  match,
  variant,
  onAccept,
  onReject,
  compact,
  actionLoading,
}: Props) {
  const profile =
    match.partnerProfile ??
    (variant === 'received' ? match.senderProfile : match.receiverProfile);
  const viewProfileId =
    profile?.id ||
    profile?.userId ||
    match.partnerUserId ||
    (variant === 'received'
      ? match.senderProfile?.id || match.senderProfile?.userId || match.senderId
      : match.receiverProfile?.id || match.receiverProfile?.userId || match.receiverId);
  const chatUserId =
    match.partnerUserId ||
    profile?.userId ||
    (variant === 'received' ? match.senderProfile?.userId : match.receiverProfile?.userId);
  const name = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'Profile';
  const photoUrl = getPhotoUrl(getMainProfilePhoto(profile || {}));
  const status = match.status || 'pending';
  const statusLabel =
    status === 'pending'
      ? 'Pending'
      : status === 'accepted'
        ? 'Mutual Match'
        : status === 'rejected'
          ? 'Declined'
          : status;

  const age = profile?.age ?? ageFromDob(profile?.dateOfBirth);
  const profession = profile?.occupation || profile?.education;
  const religion = profile?.religion;
  const location = [profile?.city, profile?.state].filter(Boolean).join(', ');
  const meta = [age != null ? `${age} yrs` : null, profession, religion, location]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={`flex gap-3 rounded-xl border border-[#F2DFE8] bg-white ${compact ? 'p-3' : 'p-4'}`}>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#FFF5F8]">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-lg">
            {profile?.gender === 'female' ? '👩' : '👨'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {viewProfileId ? (
            <Link
              to={`/app/matches/${viewProfileId}`}
              className="font-semibold text-[#5D2B44] hover:text-[#B66A8A]"
            >
              {name || 'View profile'}
            </Link>
          ) : (
            <span className="font-semibold text-[#5D2B44]">{name || 'Profile unavailable'}</span>
          )}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
          >
            {statusLabel}
          </span>
          {status === 'pending' && (
            <span className="rounded-full border border-[#E8D0DC] bg-[#FFF8FB] px-2 py-0.5 text-[10px] font-medium text-[#9A5776]">
              Limited Profile
            </span>
          )}
          {status === 'accepted' && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Full Profile
            </span>
          )}
        </div>

        {meta && <p className="mt-1 text-xs text-[#815A6D] line-clamp-2">{meta}</p>}

        {!meta && (
          <p className="mt-0.5 text-xs text-[#9A5776]">
            {match.compatibilityScore
              ? `${Math.round(match.compatibilityScore)}% compatibility`
              : status === 'accepted'
                ? 'You both accepted — start a conversation'
                : variant === 'received'
                  ? 'Sent you an interest'
                  : 'Interest sent by you'}
          </p>
        )}

        {(profession || location) && (
          <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-[#9A5776]">
            {profession && (
              <span className="inline-flex items-center gap-1">
                <Briefcase size={11} /> {profession}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} /> {location}
              </span>
            )}
          </div>
        )}

        {match.message && <p className="mt-1 text-sm text-[#815A6D] line-clamp-2">{match.message}</p>}

        {variant === 'received' && status === 'pending' && onAccept && onReject && (
          <div className="mt-3 flex flex-wrap gap-2">
            {viewProfileId && (
              <Link
                to={`/app/matches/${viewProfileId}`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D8B6C6] bg-white px-3 py-1.5 text-xs font-medium text-[#7B4A62] hover:bg-[#FFF5F8]"
              >
                <Eye size={12} /> View Profile
              </Link>
            )}
            <button
              type="button"
              disabled={actionLoading}
              onClick={onAccept}
              className="rounded-lg bg-[#B66A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#A75878] disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onReject}
              className="rounded-lg border border-[#D8B6C6] bg-white px-3 py-1.5 text-xs font-medium text-[#7B4A62] hover:bg-[#FFF5F8] disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        )}

        {status === 'accepted' && viewProfileId && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={`/app/matches/${viewProfileId}`}
              className="inline-flex items-center gap-1 rounded-lg bg-[#B66A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#A75878]"
            >
              <Eye size={12} /> View Profile
            </Link>
            {chatUserId && (
              <Link
                to={`/app/chat?userId=${chatUserId}`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D8B6C6] bg-white px-3 py-1.5 text-xs font-medium text-[#7B4A62] hover:bg-[#FFF5F8]"
              >
                <MessageCircle size={12} /> Message
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
