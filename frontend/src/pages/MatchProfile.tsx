import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, UserCircle, Users, HeartHandshake } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';
import MatchMemberCard from '../components/matchmaking/MatchMemberCard';
import {
  useProfileCompatibility,
  useAcceptedInterests,
  useMatchActions,
  useMyMatchProfile,
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [interestSent, setInterestSent] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const { sendInterest } = useMatchActions();
  const { data: sentInterests = [] } = useSentInterests();
  const { data: myProfile } = useMyMatchProfile();
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    window.scrollTo(0, 0);
    setConnectError(null);
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
    (m) =>
      m.partnerUserId === profile?.userId ||
      m.senderId === profile?.userId ||
      m.receiverId === profile?.userId,
  );

  const isOwnProfile = Boolean(
    currentUser?.id && profile?.userId && currentUser.id === profile.userId,
  );
  const needsOwnProfile = !myProfile?.id;

  const handleInterest = async () => {
    setConnectError(null);
    if (!profile) return;
    if (isOwnProfile) {
      const msg = 'You cannot send interest to your own profile';
      setConnectError(msg);
      toast.error(msg);
      return;
    }
    if (needsOwnProfile) {
      const msg = 'Complete your profile before sending interest';
      setConnectError(msg);
      toast.error(msg);
      navigate('/app/profile/edit');
      return;
    }
    const receiverId = profile.userId || profile.id;
    if (!receiverId) {
      const msg = 'Unable to send interest for this profile';
      setConnectError(msg);
      toast.error(msg);
      return;
    }
    try {
      await sendInterest.mutateAsync(receiverId);
      setInterestSent(true);
      toast.success('Interest sent successfully');
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const message = err?.response?.data?.message;
      const msg = Array.isArray(message) ? message.join(', ') : message || 'Could not send interest';
      setConnectError(msg);
      toast.error(msg);
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
          onInterest={isOwnProfile ? undefined : handleInterest}
          interestLoading={sendInterest.isPending}
          connectLabel={isOwnProfile ? 'Your Profile' : needsOwnProfile ? 'Complete Profile' : undefined}
          connectError={connectError}
          expandableBio
        />

        {needsOwnProfile && !isOwnProfile && (
          <div className="dp-panel py-3 text-center text-sm">
            <p className="text-[#6a737c]">You need a profile before you can send interest.</p>
            <Link to="/app/profile/edit" className="mt-2 inline-block font-semibold text-[#f4196d] hover:underline">
              Complete your profile →
            </Link>
          </div>
        )}

        {isOwnProfile && (
          <div className="dp-panel py-3 text-center text-sm text-[#6a737c]">
            This is your profile. Other members can send you interest from Find Your Match.
          </div>
        )}

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
