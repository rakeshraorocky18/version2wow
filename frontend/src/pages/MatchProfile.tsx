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
  useReceivedInterests,
  useSentInterests,
} from '../hooks/useMatchmaking';
import {
  resolveInterestStatus,
  resolvePartnerUserId,
  isInterestAlreadyExistsError,
  type InterestStatus,
} from '../lib/matchInterestUtils';

const FULL_TABS: { id: ProfileTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake },
];

const LIMITED_TABS: { id: ProfileTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
];

type MatchProfileResponse = {
  profile: Record<string, unknown>;
  visibility: 'full' | 'limited';
  relationship?: {
    interestStatus?: InterestStatus;
    matchId?: string | null;
    partnerUserId?: string | null;
  };
};

export default function MatchProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [localConnectedIds, setLocalConnectedIds] = useState<Set<string>>(() => new Set());
  const { sendInterest, acceptInterest, rejectInterest } = useMatchActions();
  const { data: sentInterests = [] } = useSentInterests();
  const { data: receivedInterests = [] } = useReceivedInterests();
  const { data: myProfile } = useMyMatchProfile();
  const currentUser = useAuthStore((s) => s.user);
  const { data: acceptedMatches = [] } = useAcceptedInterests();

  useEffect(() => {
    window.scrollTo(0, 0);
    setConnectError(null);
    setLocalConnectedIds(new Set());
    setActiveTab('about');
  }, [id]);

  const { data: matchData, isLoading, isError, refetch } = useQuery({
    queryKey: ['match-profile', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<MatchProfileResponse>(`/matches/profile/${id}`);
      return data;
    },
  });

  const profile = matchData?.profile as Record<string, unknown> | undefined;
  const visibility = matchData?.visibility ?? 'limited';
  const apiRelationship = matchData?.relationship;
  const tabs = visibility === 'full' ? FULL_TABS : LIMITED_TABS;

  const { data: compatibility } = useProfileCompatibility(id);

  const profileRef = profile
    ? {
        id: String(profile.id || id || ''),
        userId: String(profile.userId || ''),
        interestStatus: apiRelationship?.interestStatus,
        matchPartnerUserId: apiRelationship?.partnerUserId,
      }
    : { id: id || '', userId: '' };

  const interestStatus = profile
    ? resolveInterestStatus(
        profileRef,
        sentInterests,
        receivedInterests,
        acceptedMatches,
        currentUser?.id,
        localConnectedIds,
      )
    : 'none';

  const partnerUserId =
    resolvePartnerUserId(profileRef, acceptedMatches, sentInterests, currentUser?.id) ||
    apiRelationship?.partnerUserId ||
    profileRef.userId;

  // Find pending match ID from received interests
  const receivedMatch = receivedInterests.find((m) => {
    if (m.status !== 'pending') return false;
    // Check if this profile is the sender of the received interest
    const senderMatch =
      m.senderId === profileRef.userId ||
      m.senderId === profile?.userId ||
      m.senderProfile?.id === profileRef.id ||
      m.senderProfile?.userId === profileRef.userId;
    return senderMatch;
  });

  const pendingMatchId = apiRelationship?.matchId || receivedMatch?.id || null;

  const isOwnProfile = Boolean(
    currentUser?.id && profile?.userId && currentUser.id === profile.userId,
  );
  const needsOwnProfile = !myProfile?.id;
  
  // Show Accept/Decline buttons if: 1) not own profile, 2) received interest status, 3) have match ID
  const showAcceptDecline =
    !isOwnProfile && interestStatus === 'pending_received' && Boolean(pendingMatchId);

  const handleInterest = async () => {
    setConnectError(null);
    if (!profile) return;
    if (interestStatus !== 'none') return;
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
    const receiverId = String(profile.userId || profile.id || '');
    if (!receiverId) {
      const msg = 'Unable to send interest for this profile';
      setConnectError(msg);
      toast.error(msg);
      return;
    }
    try {
      await sendInterest.mutateAsync(receiverId);
      setLocalConnectedIds((prev) => {
        const next = new Set(prev);
        next.add(String(profile.id));
        if (profile.userId) next.add(String(profile.userId));
        return next;
      });
      toast.success('Interest sent successfully');
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const message = err?.response?.data?.message;
      const msg = Array.isArray(message) ? message.join(', ') : message || 'Could not send interest';
      if (isInterestAlreadyExistsError(msg)) {
        setLocalConnectedIds((prev) => {
          const next = new Set(prev);
          next.add(String(profile.id));
          if (profile.userId) next.add(String(profile.userId));
          return next;
        });
        refetch();
        return;
      }
      setConnectError(msg);
      toast.error(msg);
    }
  };

  const handleAccept = async () => {
    if (!pendingMatchId) return;
    try {
      await acceptInterest.mutateAsync(pendingMatchId);
      toast.success('Interest accepted! You can now chat');
      // Refetch all related data to update UI
      await Promise.all([
        refetch(),
        // Refetch lists to update accepted interests
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    } catch (error) {
      toast.error('Could not accept interest');
    }
  };

  const handleDecline = async () => {
    if (!pendingMatchId) return;
    try {
      await rejectInterest.mutateAsync(pendingMatchId);
      toast.success('Interest declined');
      navigate('/app/matches?tab=interests&interest=received');
    } catch {
      toast.error('Could not decline interest');
    }
  };

  if (isLoading) {
    return (
      <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
        <div className="dp-member-area">
          <div className="dp-member-area__inner px-4 py-16 text-center text-[#6B7280] sm:px-6">
            Loading profile...
          </div>
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
              <p className="text-[#6B7280]">Profile not found or unavailable.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const wizard = (profile.wizardProfile as Record<string, unknown>) || {};
  const personalDetails = (wizard.personalDetails as Record<string, unknown>) || {};
  const pd = { ...profile, ...personalDetails };
  const expressYourself = (wizard.expressYourself as { aboutMe?: string }) || {};
  const education = wizard.education as Array<{ degree?: string }> | undefined;
  const experience = wizard.experience as { jobTitle?: string } | undefined;
  const marital = wizard.marital as { maritalStatus?: string } | undefined;

  const cardProfile = {
    ...profile,
    firstName: (pd.firstName as string) || (profile.firstName as string),
    lastName: (pd.lastName as string) || (profile.lastName as string),
    city: (pd.city as string) || (profile.city as string),
    state: (pd.state as string) || (profile.state as string),
    country: (pd.country as string) || (profile.country as string),
    education: (profile.education as string) || education?.[0]?.degree,
    occupation: (profile.occupation as string) || experience?.jobTitle,
    maritalStatus: (profile.maritalStatus as string) || marital?.maritalStatus,
    bio: expressYourself.aboutMe || (profile.bio as string),
    compatibilityScore: compatibility?.score ?? (profile.compatibilityScore as number),
  };

  return (
    <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
      <div className="datepress-bg" aria-hidden>
        <div className="datepress-bg__streaks" />
        <div className="datepress-bg__radials">
          <span className="datepress-bg__radial datepress-bg__radial--light-pink" />
          <span className="datepress-bg__radial datepress-bg__radial--baby-pink" />
          <span className="datepress-bg__radial datepress-bg__radial--soft-blue" />
          <span className="datepress-bg__radial datepress-bg__radial--lavender" />
        </div>
        <div className="datepress-bg__frost" />
      </div>
      <section className="dp-member-area">
        <div className="dp-member-area__inner space-y-6 soft-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/app/matches"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#f4196d] hover:underline"
            >
              <ArrowLeft size={16} /> Back to Matches
            </Link>
            {!isOwnProfile && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  visibility === 'full'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-[#E8D0DC] bg-[#FFF8FB] text-[#9A5776]'
                }`}
              >
                {visibility === 'full' ? 'Full Profile' : 'Limited Profile'}
              </span>
            )}
          </div>

          <MatchMemberCard
            profile={cardProfile}
            interestStatus={interestStatus}
            partnerUserId={partnerUserId}
            onInterest={isOwnProfile || showAcceptDecline ? undefined : handleInterest}
            interestLoading={sendInterest.isPending}
            connectLabel={
              isOwnProfile
                ? 'Your Profile'
                : needsOwnProfile
                  ? 'Complete Profile'
                  : showAcceptDecline
                    ? 'Interest received'
                    : undefined
            }
            connectError={connectError}
            expandableBio
          />

          {visibility === 'limited' && !isOwnProfile && (
            <div className="dp-panel py-3 text-center text-sm text-[#6a737c]">
              Showing basic information only. Accept the interest request to unlock the full profile.
            </div>
          )}

          {showAcceptDecline && (
            <div className="dp-panel flex flex-wrap items-center justify-center gap-3 py-4">
              <button
                type="button"
                disabled={acceptInterest.isPending || rejectInterest.isPending}
                onClick={handleAccept}
                className="rounded-lg bg-[#B66A8A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A75878] disabled:opacity-60"
              >
                Accept Request
              </button>
              <button
                type="button"
                disabled={acceptInterest.isPending || rejectInterest.isPending}
                onClick={handleDecline}
                className="rounded-lg border border-[#D8B6C6] bg-white px-5 py-2.5 text-sm font-semibold text-[#7B4A62] hover:bg-[#FFF5F8] disabled:opacity-60"
              >
                Decline Request
              </button>
            </div>
          )}

          {needsOwnProfile && !isOwnProfile && (
            <div className="dp-panel py-3 text-center text-sm">
              <p className="text-[#6a737c]">You need a profile before you can send interest.</p>
              <Link
                to="/app/profile/edit"
                className="mt-2 inline-block font-semibold text-[#f4196d] hover:underline"
              >
                Complete your profile →
              </Link>
            </div>
          )}

          {isOwnProfile && (
            <div className="dp-panel py-3 text-center text-sm text-[#6a737c]">
              This is your profile. Other members can send you interest from Find Your Match.
            </div>
          )}

          <div className="dp-tabs">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
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

          <ProfileDetailsView profile={profile} tab={activeTab} visibility={visibility} />
        </div>
      </section>
    </div>
  );
}
