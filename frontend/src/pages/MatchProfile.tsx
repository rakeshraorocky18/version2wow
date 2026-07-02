import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Crown,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Star,
  UserCircle,
  UserRound,
  Users,
  HeartHandshake,
  Zap,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { getGalleryPhotos, getMainProfilePhoto, getPhotoUrl } from '../lib/profileUtils';
import { isBoostedMatchProfile } from '../lib/matchmakingPremium';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';
import ProfileGalleryView from '../components/profile/ProfileGalleryView';
import {
  useAcceptedInterests,
  useMatchActions,
  useMatchProfile,
  useProfileCompatibility,
  useSentInterests,
  useShortlist,
} from '../hooks/useMatchmaking';

const ALL_TABS: { id: ProfileTab; label: string; icon: typeof UserCircle; fullOnly?: boolean }[] = [
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Work', icon: Briefcase, fullOnly: true },
  { id: 'family', label: 'Family', icon: Users, fullOnly: true },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake, fullOnly: true },
];

function calcAge(dateOfBirth?: string, age?: number) {
  if (age != null) return age;
  if (!dateOfBirth) return null;
  return Math.max(0, new Date().getFullYear() - new Date(dateOfBirth).getFullYear());
}

function MatchRing({ score }: { score: number }) {
  return (
    <div className="relative flex h-[72px] w-[72px] items-center justify-center">
      <svg className="absolute inset-0 -rotate-90 drop-shadow-sm" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r="30"
          fill="none"
          stroke="url(#matchGrad)"
          strokeWidth="5"
          strokeDasharray={`${(score / 100) * 188.5} 188.5`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB6C8" />
            <stop offset="100%" stopColor="#B66A8A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center leading-none">
        <span className="text-lg font-bold text-white">{score}%</span>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">Match</p>
      </div>
    </div>
  );
}

export default function MatchProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const backTab = searchParams.get('from') || 'search';
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

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
      setActiveTab('personal');
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
      <div className="match-profile-page mx-auto flex max-w-4xl flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-[#F4D8E4] border-t-[#B66A8A]" />
          <Heart size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#B66A8A]" fill="currentColor" />
        </div>
        <p className="mt-5 text-sm font-medium text-[#9A5776]">Loading profile…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="match-profile-page mx-auto max-w-4xl px-4">
        <Link
          to={`/app/matches?tab=${backTab}`}
          className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#B66A8A] shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          <ArrowLeft size={16} /> Back to Matches
        </Link>
        <div className="mt-8 rounded-3xl border border-[#F2DFE8] bg-white/90 py-20 text-center shadow-lg">
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
  const mainPhotoUrl = getPhotoUrl(getMainProfilePhoto(profile as Parameters<typeof getMainProfilePhoto>[0]));
  const canViewGallery =
    fullAccess ||
    (profile as { galleryVisibility?: string }).galleryVisibility === 'public';
  const galleryVisibility = (profile as { galleryVisibility?: 'public' | 'matched_only' }).galleryVisibility;
  const galleryHidden = (profile as { galleryHidden?: boolean }).galleryHidden === true;
  const galleryPhotos = canViewGallery && !galleryHidden
    ? getGalleryPhotos(profile as Parameters<typeof getGalleryPhotos>[0])
    : [];
  const showLockedGallery = galleryHidden && !canViewGallery;
  const photoUrl = mainPhotoUrl;
  const chatUserId = profile.userId;
  const age = calcAge(pd.dateOfBirth || profile.dateOfBirth, profile.age);
  const cityState = [pd.city || profile.city, pd.state || profile.state].filter(Boolean).join(', ');
  const country = pd.country || profile.country;
  const location = [cityState, country].filter(Boolean).join(', ');
  const score = compatibility?.score;
  const isVerified = profile.isVerified as boolean | undefined;
  const isPremium = profile.isPremium as boolean | undefined;
  const boosted = isBoostedMatchProfile({ isPremium, isBoosted: profile.isBoosted as boolean | undefined });

  const quickFacts = [
    { icon: Calendar, label: 'Age', value: age != null ? `${age} yrs` : null },
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
    <div className="match-profile-page soft-fade-in mx-auto max-w-4xl space-y-6 px-1 pb-12 sm:px-0">
      {/* Back nav */}
      <Link
        to={`/app/matches?tab=${backTab}`}
        className="inline-flex items-center gap-2 rounded-full border border-[#F0DFE7] bg-white/90 px-4 py-2 text-sm font-medium text-[#B66A8A] shadow-sm backdrop-blur-sm transition hover:border-[#E5C8D5] hover:bg-white hover:shadow-md"
      >
        <ArrowLeft size={16} /> Back to Matches
      </Link>

      {/* Limited access banner */}
      {!fullAccess && (
        <div className="relative overflow-hidden rounded-2xl border border-[#E8C4D4] bg-gradient-to-r from-[#FFF5F9] via-[#FFFBFC] to-[#FFF0F5] px-5 py-4 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#F4D8E4]/40 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#B66A8A] to-[#C07AA0] text-white shadow-md">
              <Lock size={18} />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-[#5D2B44]">Limited profile view</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[#9A5776]">
                Profile photo is always visible. Album, family, preferences & contact unlock after mutual match.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero profile card */}
      <section className="relative overflow-hidden rounded-[28px] border border-[#F0DFE7] bg-white shadow-[0_20px_60px_rgba(182,106,138,0.12)]">
        {/* Decorative header gradient */}
        <div className="h-24 bg-gradient-to-r from-[#FCE8EF] via-[#F9DEE7] to-[#F3EEFF] sm:h-28">
          <div className="pointer-events-none absolute left-0 top-0 h-32 w-32 rounded-full bg-white/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-4 h-20 w-20 rounded-full bg-[#B66A8A]/10 blur-2xl" />
        </div>

        <div className="relative -mt-16 px-5 pb-6 sm:-mt-20 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            {/* Photo column */}
            <div className="mx-auto shrink-0 sm:mx-0">
              <div className="relative">
                <div className="absolute -inset-1 rounded-[26px] bg-gradient-to-br from-[#FFB6C8] via-[#B66A8A] to-[#9B5A80] opacity-80 blur-sm" />
                <div className="relative aspect-[3/4] w-[180px] overflow-hidden rounded-3xl border-[3px] border-white shadow-xl sm:w-[200px]">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-[#F3EEFF]">
                      <UserRound size={72} className="text-[#D4A8BC]" strokeWidth={1.2} />
                    </div>
                  )}
                  {score !== undefined && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[#3D1F30]/85 to-transparent pb-3 pt-10">
                      <MatchRing score={score} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info column */}
            <div className="min-w-0 flex-1 pt-2 sm:pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-[#4A2236] sm:text-4xl">
                  {fullName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                )}
                {isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Crown size={13} /> Premium
                  </span>
                )}
                {boosted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    <Zap size={13} fill="currentColor" /> Boosted
                  </span>
                )}
              </div>

              {location && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFF5F8] px-3 py-1.5 text-sm text-[#7B4A62] ring-1 ring-[#F4E4EC]">
                  <MapPin size={14} className="shrink-0 text-[#B66A8A]" />
                  {location}
                </p>
              )}

              {fullAccess && compatibility?.highlights?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {compatibility.highlights.slice(0, 4).map((h: string) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FFF0F5] to-[#F8F0FF] px-3 py-1 text-xs font-medium text-[#A65A7D] ring-1 ring-[#F4E4EC]"
                    >
                      <Star size={11} className="text-[#B66A8A]" />
                      {h}
                    </span>
                  ))}
                </div>
              ) : null}

              {quickFacts.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {quickFacts.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#FFFBFC] to-[#FFF5F8] px-3.5 py-2.5 ring-1 ring-[#F4E4EC]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#B66A8A] shadow-sm">
                        <Icon size={14} />
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B0889A]">{label}</p>
                        <p className="text-sm font-semibold text-[#5D2B44]">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {bio && (
                <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FFFBFC] px-5 py-4 ring-1 ring-[#F4E4EC]">
                  <Heart size={48} className="pointer-events-none absolute -right-2 -top-2 text-[#F4D8E4]/50" fill="currentColor" />
                  <p className="relative text-sm italic leading-relaxed text-[#6B4A5A]">
                    &ldquo;{bio}&rdquo;
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                {!fullAccess && (
                  <button
                    type="button"
                    onClick={handleInterest}
                    disabled={interestSent}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#B66A8A] via-[#C07AA0] to-[#B66A8A] bg-[length:200%_100%] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(182,106,138,0.35)] transition hover:bg-[position:100%_0] hover:shadow-[0_10px_28px_rgba(182,106,138,0.45)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    <Heart size={17} fill={interestSent ? 'currentColor' : 'none'} />
                    {interestSent ? 'Interest Sent' : 'Send Interest'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShortlist}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    isShortlisted
                      ? 'bg-amber-50 text-amber-700 ring-2 ring-amber-300'
                      : 'bg-white text-[#7B4A62] ring-2 ring-[#F0DFE7] hover:bg-[#FFF5F8] hover:ring-[#E5C8D5]'
                  }`}
                >
                  <Star size={17} fill={isShortlisted ? 'currentColor' : 'none'} />
                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </button>
                {fullAccess && (
                  <Link
                    to={chatUserId ? `/app/chat?userId=${chatUserId}` : '/app/chat'}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#B66A8A] ring-2 ring-[#B66A8A] transition hover:bg-[#FFF5F8] sm:flex-none"
                  >
                    <MessageCircle size={17} />
                    Start Chat
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(showLockedGallery || galleryPhotos.length > 0) && (
        <ProfileGalleryView
          photos={galleryPhotos}
          locked={showLockedGallery}
          visibility={galleryVisibility}
        />
      )}

      {/* Tab navigation */}
      <nav className="flex gap-2 overflow-x-auto rounded-2xl bg-[#FFF5F8]/80 p-2 ring-1 ring-[#F0DFE7] backdrop-blur-sm scrollbar-none">
        {visibleTabs.map(({ id: tabId, label, icon: Icon }) => {
          const active = activeTab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#B66A8A] to-[#9B5A80] text-white shadow-[0_4px_16px_rgba(182,106,138,0.35)]'
                  : 'text-[#7B4A62] hover:bg-white/80'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
              {!fullAccess && (tabId === 'experience' || tabId === 'family' || tabId === 'preferences') && (
                <Lock size={12} className="opacity-70" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile details */}
      <div className="overflow-hidden rounded-[24px] border border-[#F2DFE8] bg-white shadow-[0_8px_32px_rgba(182,106,138,0.08)]">
        <div className="border-b border-[#F4E4EC] bg-gradient-to-r from-[#FFFBFC] to-[#FFF5F8] px-5 py-3.5 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-[#5D2B44]">
            {visibleTabs.find((t) => t.id === activeTab)?.label ?? 'Details'}
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <ProfileDetailsView
            profile={profile}
            tab={activeTab}
            visibility={visibility}
          />
        </div>
      </div>
    </div>
  );
}
