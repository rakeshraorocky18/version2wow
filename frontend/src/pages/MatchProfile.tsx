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
      <div className="matches-page relative -mx-4 sm:-mx-6">
        <div className="matches-page-scroll-bg" aria-hidden>
          <img src="/images/matches-hero-bg.png" alt="" className="matches-page-scroll-texture" />
        </div>
        <div className="relative z-10 px-4 py-16 text-center text-[#666666] sm:px-6">Loading profile...</div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="matches-page relative -mx-4 sm:-mx-6">
        <div className="relative z-10 px-4 sm:px-6">
          <Link to="/app/matches" className="inline-flex items-center gap-2 text-[#f82f71] hover:underline">
            <ArrowLeft size={16} /> Back to Matches
          </Link>
          <div className="mt-4 rounded-2xl bg-white py-12 text-center shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <p className="text-[#666666]">Profile not found or unavailable.</p>
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
    <div className="matches-page relative -mx-4 sm:-mx-6">
      <div className="matches-page-scroll-bg" aria-hidden>
        <img src="/images/matches-hero-bg.png" alt="" className="matches-page-scroll-texture" />
      </div>

      <div className="relative z-10 space-y-6 px-4 pb-10 soft-fade-in sm:px-6">
        <Link to="/app/matches" className="inline-flex items-center gap-2 text-sm font-medium text-[#f82f71] hover:underline">
          <ArrowLeft size={16} /> Back to Matches
        </Link>

        <MatchMemberCard
          profile={cardProfile}
          interestSent={interestSent || isAcceptedMatch}
          onInterest={handleInterest}
          expandableBio
        />

        {isAcceptedMatch && (
          <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <Link to={`/app/chat?userId=${profile.userId}`} className="font-semibold text-[#f82f71] hover:underline">
              You are connected — Start Chat →
            </Link>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:gap-2 sm:px-4 ${
                activeTab === tabId
                  ? 'bg-[#f82f71] text-white shadow-md'
                  : 'text-[#666666] hover:bg-[#FFF0F5] hover:text-[#333333]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <ProfileDetailsView profile={profile} tab={activeTab} />
      </div>
    </div>
  );
}
