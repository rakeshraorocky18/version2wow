import { useNavigate } from 'react-router-dom';
import type { MatchProfile } from '../../types/matchmaking';
import MatchMemberCard from './MatchMemberCard';

type Props = {
  profile: MatchProfile;
  interestSent?: boolean;
  onInterest: () => void | Promise<void>;
  showScore?: boolean;
  animationDelay?: number;
  interestLoading?: boolean;
};

export default function MatchProfileCard({
  profile,
  interestSent = false,
  onInterest,
  showScore = false,
  animationDelay = 0,
  interestLoading = false,
}: Props) {
  const navigate = useNavigate();
  const score =
    profile.compatibility?.score ?? profile.compatibilityScore ?? undefined;

  return (
    <MatchMemberCard
      profile={profile}
      interestSent={interestSent}
      onInterest={onInterest}
      onClick={() => navigate(`/app/matches/${profile.id}`)}
      animationDelay={animationDelay}
      interestLoading={interestLoading}
      compatibilityScore={showScore ? score : undefined}
    />
  );
}
