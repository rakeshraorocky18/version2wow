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

const TABS: { id: ProfileTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake },
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
  const { sendInterest } = useMatchActions();
  const { data: sentInterests = [] } = useSentInterests();
  const { data: receivedInterests = [] } = useReceivedInterests();
  const { data: myProfile } = useMyMatchProfile();
  const currentUser = useAuthStore((s) => s.user);
  const { data: acceptedMatches = [] } = useAcceptedInterests();

  useEffect(() => {
    window.scrollTo(0, 0);
    setConnectError(null);
    setLocalConnectedIds(new Set());
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
  const apiRelationship = matchData?.relationship;

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

  const isOwnProfile = Boolean(
    currentUser?.id && profile?.userId && currentUser.id === profile.userId,
  );
  const needsOwnProfile = !myProfile?.id;

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

  if (isLoading) {
    return (
      <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
        <div className="dp-member-area">
          <div className="dp-member-area__inner px-4 py-16 text-center text-[#6B7280] sm:px-6">Loading profile...</div>
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
        <div className="datepress-bg__hearts">
          <svg className="datepress-bg__heart datepress-bg__heart--1" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 105c-1.2-1.1-28.5-26.2-28.5-45.8 0-12.4 10-22.4 22.4-22.4 7.1 0 13.7 3.4 17.8 8.6 4.1-5.2 10.7-8.6 17.8-8.6 12.4 0 22.4 10 22.4 22.4 0 19.6-27.3 44.7-28.5 45.8L60 105z" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
          </svg>
          <svg className="datepress-bg__heart datepress-bg__heart--2" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 105c-1.2-1.1-28.5-26.2-28.5-45.8 0-12.4 10-22.4 22.4-22.4 7.1 0 13.7 3.4 17.8 8.6 4.1-5.2 10.7-8.6 17.8-8.6 12.4 0 22.4 10 22.4 22.4 0 19.6-27.3 44.7-28.5 45.8L60 105z" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          </svg>
        </div>
        <div className="datepress-bg__frost" />
      </div>
      <section className="dp-member-area">
        <div className="dp-member-area__inner space-y-6 soft-fade-in">
        <Link to="/app/matches" className="inline-flex items-center gap-2 text-sm font-medium text-[#f4196d] hover:underline">
          <ArrowLeft size={16} /> Back to Matches
        </Link>

        <MatchMemberCard
          profile={cardProfile}
          interestStatus={interestStatus}
          partnerUserId={partnerUserId}
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
