import { useNavigate } from 'react-router-dom';
import type { MatchProfile } from '../../types/matchmaking';
import MatchMemberCard from './MatchMemberCard';

type Props = {
  profile: MatchProfile;
  interestSent?: boolean;
  onInterest: () => void;
  showScore?: boolean;
  animationDelay?: number;
};

export default function MatchProfileCard({
  profile,
  interestSent = false,
  onInterest,
  animationDelay = 0,
}: Props) {
  const navigate = useNavigate();

  return (
    <MatchMemberCard
      profile={profile}
      interestSent={interestSent}
      onInterest={onInterest}
      onClick={() => navigate(`/app/matches/${profile.id}`)}
      animationDelay={animationDelay}
    />
  );
}
