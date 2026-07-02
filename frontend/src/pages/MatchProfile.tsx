import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, UserCircle, Users, HeartHandshake } from 'lucide-react';
import api from '../lib/api';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';
import MatchMemberCard from '../components/matchmaking/MatchMemberCard';
import {
  useProfileCompatibility,
  useAcceptedInterests,
  useMatchActions,
  useSentInterests,
} from '../hooks/useMatchmaking';

const TABS: { id: ProfileTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake },
];

export default function MatchProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [interestSent, setInterestSent] = useState(false);
  const { sendInterest } = useMatchActions();
  const { data: sentInterests = [] } = useSentInterests();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['match-profile', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/users/profile/${id}`);
      return data;
    },
  });

  const { data: compatibility } = useProfileCompatibility(id);
  const { data: acceptedMatches = [] } = useAcceptedInterests();

  useEffect(() => {
    if (!profile) return;
    const sent = sentInterests.some(
      (m) =>
        m.receiverProfile?.id === profile.id ||
        m.receiverProfile?.userId === profile.userId ||
        m.receiverId === profile.userId,
    );
    setInterestSent(sent);
  }, [profile, sentInterests]);

  const isAcceptedMatch = acceptedMatches.some(
    (m: { partnerUserId?: string }) => m.partnerUserId === profile?.userId,
  );

  const handleInterest = async () => {
    if (!profile?.id) return;
    try {
      await sendInterest.mutateAsync(profile.id);
      setInterestSent(true);
      toast.success('Interest sent successfully');
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not send interest');
    }
  };

  if (isLoading) {
    return (
      <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
        <div className="dp-member-area">
          <div className="dp-member-area__inner px-4 py-16 text-center text-[#6a737c] sm:px-6">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
        <div className="dp-member-area">
          <div className="dp-member-area__inner px-4 sm:px-6">
            <Link to="/app/matches" className="inline-flex items-center gap-2 text-[#f4196d] hover:underline">
              <ArrowLeft size={16} /> Back to Matches
            </Link>
            <div className="dp-panel mt-4 py-12 text-center">
              <p className="text-[#6a737c]">Profile not found or unavailable.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = { ...profile, ...(wizard.personalDetails || {}) };
  const cardProfile = {
    ...profile,
    firstName: pd.firstName || profile.firstName,
    lastName: pd.lastName || profile.lastName,
    city: pd.city || profile.city,
    state: pd.state || profile.state,
    country: pd.country || profile.country,
    education: profile.education || wizard.education?.[0]?.degree,
    occupation: profile.occupation || wizard.experience?.jobTitle,
    maritalStatus: profile.maritalStatus || wizard.marital?.maritalStatus,
    bio: wizard.expressYourself?.aboutMe || profile.bio,
    compatibilityScore: compatibility?.score ?? profile.compatibilityScore,
  };

  return (
    <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
      <section className="dp-member-area">
        <div className="dp-member-area__inner space-y-6 soft-fade-in">
        <Link to="/app/matches" className="inline-flex items-center gap-2 text-sm font-medium text-[#f4196d] hover:underline">
          <ArrowLeft size={16} /> Back to Matches
        </Link>

        <MatchMemberCard
          profile={cardProfile}
          interestSent={interestSent || isAcceptedMatch}
          onInterest={handleInterest}
          expandableBio
        />

        {isAcceptedMatch && (
          <div className="dp-panel py-3 text-center text-sm">
            <Link to={`/app/chat?userId=${profile.userId}`} className="font-semibold text-[#f4196d] hover:underline">
              You are connected — Start Chat →
            </Link>
          </div>
        )}

        <div className="dp-tabs">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`dp-tabs__btn ${activeTab === tabId ? 'is-active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <ProfileDetailsView profile={profile} tab={activeTab} />
        </div>
      </section>
    </div>
  );
}
