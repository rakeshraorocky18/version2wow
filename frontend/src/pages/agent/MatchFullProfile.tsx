import { useParams } from 'react-router-dom';
import CustomerProfile from './CustomerProfile';

export default function MatchFullProfile() {
  const { matchedProfileId } = useParams();
  return <CustomerProfile overrideCustomerId={matchedProfileId} isMatchProfile />;
}
