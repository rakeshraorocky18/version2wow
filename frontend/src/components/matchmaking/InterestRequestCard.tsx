import { Link } from 'react-router-dom';
import { Eye, MessageCircle } from 'lucide-react';
import { getPhotoUrl } from '../../lib/profileUtils';
import type { MatchInterest } from '../../types/matchmaking';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-gray-100 text-gray-600 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
};

type Props = {
  match: MatchInterest;
  variant: 'received' | 'sent';
  onAccept?: () => void;
  onReject?: () => void;
  compact?: boolean;
};

export default function InterestRequestCard({ match, variant, onAccept, onReject, compact }: Props) {
  const profile =
    match.partnerProfile ??
    (variant === 'received' ? match.senderProfile : match.receiverProfile);
  const viewProfileId =
    profile?.id ||
    profile?.userId ||
    match.partnerUserId ||
    (variant === 'received' ? match.senderId : match.receiverId);
  const chatUserId = match.partnerUserId || profile?.userId || viewProfileId;
  const name = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'Profile';
  const photoUrl = getPhotoUrl(profile?.photos?.[0] || profile?.wizardProfile?.profilePhoto || '');
  const status = match.status || 'pending';
  const statusLabel =
    status === 'pending' ? 'Pending' : status === 'accepted' ? 'Mutual Match' : status === 'rejected' ? 'Declined' : status;

  return (
    <div className={`flex gap-3 rounded-xl border border-[#F2DFE8] bg-white ${compact ? 'p-3' : 'p-4'}`}>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#FFF5F8]">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-lg">{profile?.gender === 'female' ? '👩' : '👨'}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {viewProfileId ? (
            <Link to={`/app/matches/${viewProfileId}`} className="font-semibold text-[#5D2B44] hover:text-[#B66A8A]">
              {name || 'View profile'}
            </Link>
          ) : (
            <span className="font-semibold text-[#5D2B44]">{name || 'Profile unavailable'}</span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#9A5776]">
          {match.compatibilityScore
            ? `${Math.round(match.compatibilityScore)}% compatibility`
            : status === 'accepted'
              ? 'You both accepted — start a conversation'
              : variant === 'received'
                ? 'Sent you an interest'
                : 'Interest sent by you'}
        </p>
        {match.message && <p className="mt-1 text-sm text-[#815A6D] line-clamp-2">{match.message}</p>}

        {variant === 'received' && status === 'pending' && onAccept && onReject && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onAccept} className="rounded-lg bg-[#B66A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#A75878]">
              Accept
            </button>
            <button type="button" onClick={onReject} className="rounded-lg border border-[#D8B6C6] bg-white px-3 py-1.5 text-xs font-medium text-[#7B4A62] hover:bg-[#FFF5F8]">
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
