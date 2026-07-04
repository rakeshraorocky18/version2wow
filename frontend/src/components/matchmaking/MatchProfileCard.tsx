import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { MatchProfile } from '../../types/matchmaking';
import type { InterestStatus } from '../../lib/matchInterestUtils';
import MatchMemberCard from './MatchMemberCard';

type Props = {
  profile: MatchProfile;
  interestStatus?: InterestStatus;
  partnerUserId?: string;
  onInterest?: () => void | Promise<void>;
  onShortlist?: () => void | Promise<void>;
  isShortlisted?: boolean;
  showScore?: boolean;
  animationDelay?: number;
  interestLoading?: boolean;
  shortlistLoading?: boolean;
};

export default function MatchProfileCard({
  profile,
  interestStatus = 'none',
  partnerUserId,
  onInterest,
  onShortlist,
  isShortlisted = false,
  showScore = false,
  animationDelay = 0,
  interestLoading = false,
  shortlistLoading = false,
}: Props) {
  const navigate = useNavigate();
  const score = profile.compatibility?.score ?? profile.compatibilityScore ?? undefined;
  const canChat = interestStatus === 'accepted';

  return (
    <MatchMemberCard
      profile={profile}
      interestStatus={interestStatus}
      partnerUserId={partnerUserId}
      onInterest={onInterest}
      onShortlist={onShortlist}
      isShortlisted={isShortlisted}
      onMessage={
        canChat
          ? undefined
          : () => toast('Connect first to start messaging', { icon: '💬' })
      }
      onBlock={() => toast('Block feature coming soon', { icon: '🛡️' })}
      onReport={() => toast('Report submitted — our team will review', { icon: '🚩' })}
      onClick={() => navigate(`/app/matches/${profile.id}`)}
      animationDelay={animationDelay}
      interestLoading={interestLoading}
      shortlistLoading={shortlistLoading}
      compatibilityScore={showScore ? score : undefined}
    />
  );
}
