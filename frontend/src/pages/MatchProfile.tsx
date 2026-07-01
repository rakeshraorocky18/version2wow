import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  UserCircle,
  Users,
  HeartHandshake,
  UserRound,
} from 'lucide-react';
import { getPhotoUrl } from '../lib/profileUtils';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';
import {
  useAcceptedInterests,
  useMatchActions,
  useMatchProfile,
  useProfileCompatibility,
  useSentInterests,
  useShortlist,
} from '../hooks/useMatchmaking';

const ALL_TABS: { id: ProfileTab; label: string; icon: typeof Sparkles; fullOnly?: boolean }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family', icon: Users, fullOnly: true },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake, fullOnly: true },
];

function calcAge(dateOfBirth?: string, age?: number) {
  if (age != null) return age;
  if (!dateOfBirth) return null;
  return Math.max(0, new Date().getFullYear() - new Date(dateOfBirth).getFullYear());
}

export default function MatchProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const backTab = searchParams.get('from') || 'search';
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');

  const { data, isLoading, isError, refetch } = useMatchProfile(id);
  const profile = data?.profile;
  const apiVisibility = data?.visibility ?? 'limited';
  const { data: acceptedInterests = [] } = useAcceptedInterests();

  const isMutualMatch = useMemo(() => {
    if (!id && !profile) return false;
    const profileUserId = profile?.userId as string | undefined;
    const profileId = profile?.id as string | undefined;
    return acceptedInterests.some((m) => {
      if (m.status !== 'accepted') return false;
      const partnerUserId = m.partnerUserId || m.partnerProfile?.userId;
      const partnerProfileId = m.partnerProfile?.id;
      return (
        partnerUserId === profileUserId ||
        partnerProfileId === id ||
        partnerProfileId === profileId ||
        m.senderId === profileUserId ||
        m.receiverId === profileUserId ||
        m.senderId === id ||
        m.receiverId === id
      );
    });
  }, [acceptedInterests, profile, id]);

  const fullAccess = apiVisibility === 'full' || isMutualMatch;
  const visibility = fullAccess ? 'full' : apiVisibility;

  useEffect(() => {
    if (isMutualMatch && apiVisibility === 'limited') {
      refetch();
    }
  }, [isMutualMatch, apiVisibility, refetch]);

  const { data: compatibility } = useProfileCompatibility(id);
  const { data: sentInterests = [] } = useSentInterests();
  const { data: shortlistData } = useShortlist();
  const { sendInterest, toggleShortlist } = useMatchActions();

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => fullAccess || !t.fullOnly),
    [fullAccess],
  );

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab('about');
    }
  }, [visibleTabs, activeTab]);

  const interestSent = useMemo(
    () =>
      sentInterests.some(
        (m) =>
          m.receiverId === profile?.userId ||
          m.receiverProfile?.id === id ||
          m.receiverProfile?.userId === profile?.userId,
      ),
    [sentInterests, profile?.userId, id],
  );

  const isShortlisted = useMemo(
    () =>
      shortlistData?.profiles?.some(
        (p: { id?: string; userId?: string }) => p.id === id || p.userId === profile?.userId,
      ) ?? false,
    [shortlistData, id, profile?.userId],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#B66A8A] border-t-transparent" />
        <p className="mt-4 text-sm text-[#9A5776]">Loading profile…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          to={`/app/matches?tab=${backTab}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#B66A8A] hover:underline"
        >
          <ArrowLeft size={16} /> Back to Matches
        </Link>
        <div className="mt-6 rounded-2xl border border-[#F2DFE8] bg-white py-16 text-center">
          <p className="text-[#815A6D]">Profile not found or unavailable.</p>
        </div>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = { ...profile, ...(wizard.personalDetails || {}) };
  const religion = wizard.religion?.religion || profile.religion;
  const express = wizard.expressYourself || profile.expressYourself || {};
  const bio = express.aboutMe || profile.bio;
  const fullName =
    pd.displayName ||
    `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim() ||
    'Profile';
  const photoUrl = getPhotoUrl(wizard.profilePhoto || profile.photos?.[0] || '');
  const chatUserId = profile.userId;
  const age = calcAge(pd.dateOfBirth || profile.dateOfBirth, profile.age);
  const cityState = [pd.city || profile.city, pd.state || profile.state].filter(Boolean).join(', ');
  const country = pd.country || profile.country;
  const location = [cityState, country].filter(Boolean).join(', ');
  const score = compatibility?.score;

  const quickFacts = [
    { icon: Calendar, label: 'Age', value: age != null ? `${age} years` : null },
    { icon: BookOpen, label: 'Religion', value: religion },
    { icon: MapPin, label: 'Location', value: cityState || location },
  ].filter((f) => f.value);

  const handleInterest = async () => {
    try {
      await sendInterest.mutateAsync(profile.id as string);
      toast.success('Interest sent successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not send interest');
    }
  };

  const handleShortlist = async () => {
    try {
      await toggleShortlist.mutateAsync({ profileId: profile.id as string, shortlisted: isShortlisted });
      toast.success(isShortlisted ? 'Removed from shortlist' : 'Added to shortlist');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not update shortlist');
    }
  };

  return (
    <div className="soft-fade-in mx-auto max-w-5xl space-y-5 pb-10">
      <Link
        to={`/app/matches?tab=${backTab}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#B66A8A] transition hover:text-[#A75878]"
      >
        <ArrowLeft size={16} /> Back to Matches
      </Link>

      {!fullAccess && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#E5C8D5] bg-[#FFF8FB] px-4 py-3">
          <Lock size={18} className="mt-0.5 shrink-0 text-[#B66A8A]" />
          <div>
            <p className="text-sm font-semibold text-[#5D2B44]">Limited profile view</p>
            <p className="text-xs text-[#9A5776]">
              About Me, Education, Personal, and Religion are visible now. Accept the interest to unlock family, preferences, horoscope, and contact details.
            </p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-white shadow-[0_12px_40px_rgba(174,94,129,0.1)]">
        <div className="grid lg:grid-cols-[220px_1fr]">
          <div className="relative bg-gradient-to-br from-[#FFF0F5] to-[#F3EEFF] p-5 lg:p-6">
            <div className="mx-auto aspect-[3/4] max-w-[200px] overflow-hidden rounded-2xl border-4 border-white shadow-lg lg:max-w-none">
              {photoUrl ? (
                <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-[#FFF5F8]">
                  <UserRound size={64} className="text-[#D4A8BC]" strokeWidth={1.5} />
                </div>
              )}
            </div>
            {score !== undefined && (
              <div className="mt-4 text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#F7E4EC" strokeWidth="5" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#B66A8A"
                      strokeWidth="5"
                      strokeDasharray={`${(score / 100) * 175.9} 175.9`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-sm font-bold text-[#B66A8A]">{score}%</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#9A5776]">Match</p>
              </div>
            )}
          </div>

          <div className="flex flex-col border-t border-[#F2DFE8] p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-[#4A2236] sm:text-3xl">{fullName}</h1>

              {location && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#815A6D]">
                  <MapPin size={15} className="shrink-0 text-[#B66A8A]" />
                  {location}
                </p>
              )}

              {fullAccess && compatibility?.highlights?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {compatibility.highlights.slice(0, 3).map((h: string) => (
                    <span
                      key={h}
                      className="rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-medium text-[#A65A7D]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              ) : null}

              {quickFacts.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {quickFacts.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#F4E4EC] bg-[#FFFBFC] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#B0889A]">
                        <Icon size={12} />
                        {label}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#5D2B44]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {bio && (
                <blockquote className="mt-5 border-l-4 border-[#D4A8BC] bg-[#FFFBFC] px-4 py-3 text-sm italic leading-relaxed text-[#6B4A5A]">
                  &ldquo;{bio}&rdquo;
                </blockquote>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5 border-t border-[#F4E4EC] pt-5">
              {!fullAccess && (
                <button
                  type="button"
                  onClick={handleInterest}
                  disabled={interestSent}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B66A8A] to-[#C07AA0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#A75878] hover:to-[#B06A90] disabled:opacity-60 sm:flex-none"
                >
                  <Heart size={16} fill={interestSent ? 'currentColor' : 'none'} />
                  {interestSent ? 'Interested' : 'Send Interest'}
                </button>
              )}
              <button
                type="button"
                onClick={handleShortlist}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                  isShortlisted
                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                    : 'border-[#F0DFE7] bg-white text-[#7B4A62] hover:border-[#E5C8D5]'
                }`}
              >
                <Star size={16} fill={isShortlisted ? 'currentColor' : 'none'} />
                {isShortlisted ? 'Shortlisted' : 'Shortlist'}
              </button>
              {fullAccess && (
                <Link
                  to={chatUserId ? `/app/chat?userId=${chatUserId}` : '/app/chat'}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#B66A8A] bg-white px-5 py-2.5 text-sm font-semibold text-[#B66A8A] transition hover:bg-[#FFF5F8] sm:flex-none"
                >
                  <MessageCircle size={16} />
                  Chat
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#F0DFE7] bg-[#FFFBFC] p-1.5 scrollbar-none">
        {visibleTabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tabId
                ? 'bg-gradient-to-r from-[#B66A8A] to-[#9B5A80] text-white shadow-md'
                : 'text-[#7B4A62] hover:bg-[#FFF0F5]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl border border-[#F2DFE8] bg-white p-4 shadow-sm sm:p-5">
        <ProfileDetailsView
          profile={profile}
          tab={activeTab}
          omitExpress={!!bio}
          visibility={visibility}
        />
      </div>
    </div>
  );
}
