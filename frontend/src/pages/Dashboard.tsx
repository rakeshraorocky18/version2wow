import {
  Heart,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Star,
  Camera,
  Check,
  ChevronRight,
  Send,
  User,
  Search,
  Bookmark,
  Users,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {
  useMatchActions,
  useReceivedInterests,
  useSentInterests,
  useAcceptedInterests,
  useMyMatchProfile,
  useMatchSuggestions,
  useShortlist,
} from '../hooks/useMatchmaking';
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import MatchProfileCard from '../components/matchmaking/MatchProfileCard';
import { EMPTY_FILTERS } from '../types/matchmaking';
import {
  apiProfileToForm,
  profileCompletion,
  getMissingBySection,
} from '../lib/profileEditValidation';
import { getMainProfilePhoto, getPhotoUrl } from '../lib/profileUtils';

// ─── Reusable sub-components ───────────────────────────────────────────────

function CircularProgressRing({
  percent,
  size = 120,
  strokeWidth = 9,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const cx = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className="wow-progress-ring-svg"
      aria-label={`${percent}% complete`}
    >
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4196d" />
          <stop offset="50%" stopColor="#ED88B2" />
          <stop offset="100%" stopColor="#B984E5" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#FBE6EC" strokeWidth={strokeWidth} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="url(#progressGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  bg,
  to,
  delay = '',
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  bg: string;
  to: string;
  delay?: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col gap-3 rounded-3xl border border-[#FFF0F4] bg-white p-5 shadow-[0_8px_24px_rgba(244,25,109,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F6D6DF] hover:shadow-[0_16px_36px_rgba(244,25,109,0.12)] wow-animate-slide-up ${delay} relative overflow-hidden`}
    >
      <div className="wow-card-lace opacity-40" />
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg} transition-transform duration-300 group-hover:scale-110`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-[#3D2635] leading-none group-hover:text-[#f4196d] transition-colors">{value}</p>
        <p className="mt-1 text-xs font-semibold text-[#8E7385] tracking-wide">{label}</p>
      </div>
      <span className={`mt-auto inline-flex items-center gap-1 text-[11px] font-bold ${color} opacity-0 transition-opacity group-hover:opacity-100`}>
        View <ChevronRight size={12} />
      </span>
    </Link>
  );
}

function QuickActionBtn({
  icon,
  label,
  to,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  color: string;
  bg: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-[#FFF0F4] bg-[#FFFDFE] p-4 shadow-[0_4px_16px_rgba(244,25,109,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F6D6DF] hover:bg-white hover:shadow-[0_12px_28px_rgba(244,25,109,0.12)]"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${bg} shadow-sm`}>
        <span className={color}>{icon}</span>
      </div>
      <span className="text-center text-[11px] font-bold text-[#5D3F54] leading-tight group-hover:text-[#f4196d]">
        {label}
      </span>
    </Link>
  );
}

const quickActions = [
  { icon: <Search size={20} />, label: 'Discover', to: '/app/matches', color: 'text-[#f4196d]', bg: 'bg-[#FCEAF1]' },
  { icon: <Sparkles size={20} />, label: 'Suggested', to: '/app/matches?tab=suggestions', color: 'text-[#B984E5]', bg: 'bg-[#F1ECFF]' },
  { icon: <Heart size={20} />, label: 'Interests', to: '/app/matches?tab=interests', color: 'text-[#f4196d]', bg: 'bg-[#FFF0F4]' },
  { icon: <Star size={20} />, label: 'Shortlist', to: '/app/matches?tab=shortlist', color: 'text-[#C89F53]', bg: 'bg-[#FFFCEF]' },
  { icon: <MessageCircle size={20} />, label: 'Chat', to: '/app/chat', color: 'text-[#8860BE]', bg: 'bg-[#F5EEFF]' },
  { icon: <User size={20} />, label: 'My Profile', to: '/app/profile', color: 'text-[#7A5CAD]', bg: 'bg-[#F2ECFF]' },
  { icon: <Camera size={20} />, label: 'Photos', to: '/app/profile/photos', color: 'text-[#ED88B2]', bg: 'bg-[#FFF1F5]' },
  { icon: <Shield size={20} />, label: 'Privacy', to: '/app/profile/edit', color: 'text-[#3974A1]', bg: 'bg-[#EAF4FF]' },
];

// ─── Dashboard Component ──────────────────────────────────────────────────

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { acceptInterest, rejectInterest, sendInterest } = useMatchActions();
  const { data: myProfile } = useMyMatchProfile();
  const { data: receivedInterests = [] } = useReceivedInterests();
  const { data: sentInterests = [] } = useSentInterests();
  const { data: acceptedInterests = [] } = useAcceptedInterests();
  const { data: suggestionsData } = useMatchSuggestions(EMPTY_FILTERS);
  const { data: shortlistData } = useShortlist();

  const pendingRequests = receivedInterests.length;
  const sentPending = sentInterests.filter((m) => m.status === 'pending').length;
  const acceptedCount = acceptedInterests.length;
  const shortlistCount = shortlistData?.profiles?.length ?? 0;
  const suggestedProfiles = suggestionsData?.profiles?.slice(0, 4) ?? [];

  const userName = myProfile?.firstName
    || (user?.email ? user.email.split('@')[0] : 'there');

  const formSnapshot = myProfile ? apiProfileToForm(myProfile) : null;
  const completionPct = formSnapshot ? profileCompletion(formSnapshot) : 0;
  const missingSections = formSnapshot ? getMissingBySection(formSnapshot) : [];
  const mainPhoto = myProfile ? getMainProfilePhoto(myProfile) : '';
  const photoUrl = mainPhoto ? getPhotoUrl(mainPhoto) : '';

  const profileSteps = [
    { label: 'Basic Details', done: completionPct >= 20 },
    { label: 'Photos Added', done: Boolean(photoUrl) },
    { label: 'Preferences Set', done: completionPct >= 60 },
    { label: 'Profile Verified', done: completionPct >= 100 },
  ];

  const matchActivity = [
    ...(pendingRequests > 0
      ? [{ icon: <Heart size={14} />, text: `${pendingRequests} new interest${pendingRequests > 1 ? 's' : ''} received`, time: 'Just now', color: 'text-[#f4196d] bg-[#FCEAF1]' }]
      : []),
    ...(acceptedCount > 0
      ? [{ icon: <Users size={14} />, text: `${acceptedCount} mutual match${acceptedCount > 1 ? 'es' : ''}`, time: 'Active', color: 'text-[#8860BE] bg-[#F1ECFF]' }]
      : []),
    ...(sentPending > 0
      ? [{ icon: <Send size={14} />, text: `${sentPending} interest${sentPending > 1 ? 's' : ''} awaiting reply`, time: 'Pending', color: 'text-[#C89F53] bg-[#FFFCEF]' }]
      : []),
    ...(shortlistCount > 0
      ? [{ icon: <Bookmark size={14} />, text: `${shortlistCount} profile${shortlistCount > 1 ? 's' : ''} shortlisted`, time: 'Saved', color: 'text-[#7A5CAD] bg-[#F2ECFF]' }]
      : []),
  ];

  const showMatchSection =
    user?.role === 'bride' ||
    user?.role === 'groom' ||
    user?.role === 'representative' ||
    user?.role === 'family' ||
    pendingRequests > 0 ||
    sentInterests.length > 0 ||
    acceptedCount > 0;

  return (
    <div className="relative space-y-6 pb-4 wow-animate-fade-in px-1">

      {/* Floating romantic accents */}
      <div className="wow-floating-heart text-xl top-10 left-[8%]" style={{ animationDelay: '0s', animationDuration: '7s' }}>💕</div>
      <div className="wow-floating-heart text-2xl top-44 right-[10%]" style={{ animationDelay: '1.5s', animationDuration: '8s' }}>💖</div>
      <div className="wow-floating-heart text-lg top-[60%] left-[5%]" style={{ animationDelay: '3s', animationDuration: '6s' }}>✨</div>
      <div className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-[#FFF0F4]/60 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-16 h-72 w-72 rounded-full bg-[#F5EEFF]/60 blur-3xl" />

      {/* ═══ HERO — Matchmaking welcome ═══ */}
      <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="relative overflow-hidden rounded-3xl border border-[#FFF0F4] bg-gradient-to-br from-[#FFFDFE] via-[#FFF5F8] to-[#FAF0FF] p-6 sm:p-8 shadow-[0_12px_36px_rgba(244,25,109,0.1)]">
          <div className="wow-card-lace opacity-60" />
          {/* Decorative matchmaking illustration */}
          <div className="absolute inset-y-0 right-0 w-2/5 pointer-events-none overflow-hidden hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-l from-[#FFF5F8]/80 to-transparent z-10" />
            <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col items-center gap-3 opacity-80">
              <span className="text-6xl">💕</span>
              <span className="text-3xl">✨</span>
              <span className="text-5xl">💖</span>
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FBE6EC] bg-[#FFF0F4] px-3.5 py-1 text-[10px] font-bold tracking-widest text-[#f4196d] uppercase shadow-sm">
              <Heart size={11} fill="currentColor" /> Your Match Journey
            </span>

            <h1 className="mt-4 text-3xl font-display font-bold leading-tight sm:text-4xl text-[#3D2635]">
              Hello, <span className="wow-text-rosegold">{userName}</span> 💕
            </h1>
            <p className="mt-2 text-sm text-[#8E7385] leading-relaxed max-w-md">
              Discover meaningful connections tailored to you. Browse profiles, send interests, and find your perfect match.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {pendingRequests > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#FDF0F4] px-3 py-1.5 text-xs font-semibold text-[#f4196d] border border-[#FBE6EC] animate-pulse">
                  <Heart size={12} fill="currentColor" /> {pendingRequests} new interest{pendingRequests > 1 ? 's' : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full bg-[#FFFBEF] px-3 py-1.5 text-xs font-semibold text-[#C89F53] border border-[#FCEECF]">
                <Sparkles size={12} /> {acceptedCount} mutual match{acceptedCount !== 1 ? 'es' : ''}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#F5EEFF] px-3 py-1.5 text-xs font-semibold text-[#8860BE] border border-[#E8D9FF]">
                <Star size={12} /> {shortlistCount} shortlisted
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/app/matches"
                className="inline-flex items-center gap-2 rounded-full wow-btn-romantic px-6 py-3 text-xs font-bold shadow-md"
              >
                <Search size={13} /> Discover Matches <ArrowRight size={13} />
              </Link>
              <Link
                to="/app/matches?tab=interests"
                className="inline-flex items-center gap-2 rounded-full border border-[#FBE6EC] bg-white px-6 py-3 text-xs font-bold text-[#f4196d] transition-all duration-200 hover:bg-[#FFF0F4] hover:shadow-sm"
              >
                <Heart size={13} fill="currentColor" /> View Interests
              </Link>
            </div>
          </div>
        </div>

        {/* Profile completion widget */}
        <div className="rounded-3xl border border-[#FFF0F4] bg-white p-6 shadow-[0_12px_36px_rgba(244,25,109,0.06)] flex flex-col relative overflow-hidden">
          <div className="wow-card-lace opacity-40" />
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-base font-bold text-[#3D2635]">Profile Strength</h2>
            <span className="text-xs font-bold text-[#f4196d] bg-[#FFF0F4] px-2.5 py-1 rounded-full">
              {completionPct}%
            </span>
          </div>

          <div className="flex flex-col items-center mt-2">
            <div className="relative inline-flex items-center justify-center">
              {photoUrl ? (
                <div className="relative">
                  <CircularProgressRing percent={completionPct} size={100} strokeWidth={8} />
                  <img
                    src={photoUrl}
                    alt="Your profile"
                    className="absolute inset-0 m-auto h-[72px] w-[72px] rounded-full object-cover border-2 border-white shadow-md"
                  />
                </div>
              ) : (
                <div className="relative inline-flex items-center justify-center">
                  <CircularProgressRing percent={completionPct} size={100} strokeWidth={8} />
                  <div className="absolute flex flex-col items-center">
                    <User size={24} className="text-[#f4196d]" />
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-center text-[#8E7385]">
              {completionPct >= 100
                ? 'Your profile is complete! 🎉'
                : 'Complete your profile to get better matches'}
            </p>
          </div>

          <ul className="mt-4 space-y-2 flex-1">
            {profileSteps.map((step) => (
              <li key={step.label} className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                    step.done ? 'bg-[#f4196d]' : 'border-2 border-[#F6D6DF] bg-white'
                  }`}
                >
                  {step.done && <Check size={11} strokeWidth={3} />}
                </span>
                <span className={`text-xs ${step.done ? 'text-[#3D2635] font-semibold' : 'text-[#8E7385]'}`}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>

          {completionPct < 100 && missingSections.length > 0 && (
            <Link
              to="/app/profile/edit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f4196d] to-[#ED88B2] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Complete Profile <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </section>

      {/* ═══ MATCH STATS ═══ */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Heart size={18} fill="currentColor" />}
          value={pendingRequests}
          label="Interests Received"
          color="text-[#f4196d]"
          bg="bg-[#FFF0F4]"
          to="/app/matches?tab=interests&interest=received"
          delay="wow-animate-delay-1"
        />
        <StatCard
          icon={<Users size={18} />}
          value={acceptedCount}
          label="Mutual Matches"
          color="text-[#8860BE]"
          bg="bg-[#F5EEFF]"
          to="/app/matches?tab=interests&interest=accepted"
          delay="wow-animate-delay-2"
        />
        <StatCard
          icon={<Send size={18} />}
          value={sentPending}
          label="Awaiting Reply"
          color="text-[#C89F53]"
          bg="bg-[#FFFCEF]"
          to="/app/matches?tab=interests&interest=sent"
          delay="wow-animate-delay-3"
        />
        <StatCard
          icon={<Star size={18} fill="currentColor" />}
          value={shortlistCount}
          label="Shortlisted"
          color="text-[#C89F53]"
          bg="bg-[#FFFCEF]"
          to="/app/matches?tab=shortlist"
          delay="wow-animate-delay-4"
        />
        <StatCard
          icon={<MessageCircle size={18} />}
          value={acceptedCount}
          label="Conversations"
          color="text-[#7A5CAD]"
          bg="bg-[#F2ECFF]"
          to="/app/chat"
          delay="wow-animate-delay-5"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          value={`${completionPct}%`}
          label="Profile Complete"
          color="text-[#f4196d]"
          bg="bg-[#FFF0F4]"
          to="/app/profile"
          delay="wow-animate-delay-6"
        />
      </section>

      {/* ═══ QUICK ACTIONS ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Heart size={18} className="text-[#f4196d]" fill="currentColor" />
          <h2 className="font-display text-lg font-bold text-[#3D2635]">Find Your Match</h2>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {quickActions.map((a) => (
            <QuickActionBtn key={a.to + a.label} {...a} />
          ))}
        </div>
      </section>

      {/* ═══ INTEREST REQUESTS — prominent when pending ═══ */}
      {showMatchSection && pendingRequests > 0 && (
        <section className="rounded-2xl border border-[#F6D6DF] bg-gradient-to-br from-[#FFF9FC] to-[#FFF5F8] p-6 shadow-[0_10px_30px_rgba(244,25,109,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#3D2635] flex items-center gap-2">
                <Heart size={20} className="text-[#f4196d]" fill="currentColor" />
                Someone is interested in you!
              </h2>
              <p className="mt-1 text-sm text-[#8E7385]">
                {pendingRequests} profile{pendingRequests > 1 ? 's' : ''} sent you an interest — review and respond
              </p>
            </div>
            <Link
              to="/app/matches?tab=interests&interest=received"
              className="text-sm font-semibold text-[#f4196d] hover:text-[#c01458] transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {receivedInterests.slice(0, 3).map((match) => (
              <InterestRequestCard
                key={match.id}
                match={match}
                variant="received"
                compact
                onAccept={async () => {
                  await acceptInterest.mutateAsync(match.id);
                  toast.success('Interest accepted — you can chat now!');
                }}
                onReject={async () => {
                  await rejectInterest.mutateAsync(match.id);
                  toast.success('Interest declined');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══ SUGGESTED FOR YOU + ACTIVITY ═══ */}
      <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-[#EFDCE6] bg-white p-6 shadow-[0_10px_30px_rgba(244,25,109,0.08)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#B984E5]" />
              <h2 className="font-display text-lg font-semibold text-[#3D2635]">Suggested For You</h2>
            </div>
            <Link
              to="/app/matches?tab=suggestions"
              className="text-xs font-semibold text-[#f4196d] hover:text-[#c01458] transition-colors"
            >
              See all →
            </Link>
          </div>

          {suggestedProfiles.length > 0 ? (
            <div className="space-y-3">
              {suggestedProfiles.map((profile: import('../types/matchmaking').MatchProfile, i: number) => (
                <MatchProfileCard
                  key={profile.id}
                  profile={profile}
                  animationDelay={i * 0.05}
                  onInterest={async () => {
                    const receiverId = profile.userId || profile.id;
                    if (!receiverId) {
                      toast.error('Unable to send interest');
                      return;
                    }
                    try {
                      await sendInterest.mutateAsync(receiverId);
                      toast.success('Interest sent! 💕');
                    } catch (error: unknown) {
                      const err = error as { response?: { data?: { message?: string } } };
                      toast.error(err?.response?.data?.message || 'Could not send interest');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E6CDD8] bg-[#FFFBFC] p-8 text-center">
              <Sparkles size={32} className="mx-auto text-[#D4A8BC] mb-3" />
              <p className="text-sm text-[#8E7385]">Complete your profile to get personalized suggestions</p>
              <Link
                to="/app/profile/edit"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f4196d] hover:underline"
              >
                Complete profile <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Match activity feed */}
        <div className="rounded-2xl border border-[#EFDCE6] bg-white p-6 shadow-[0_10px_30px_rgba(244,25,109,0.08)]">
          <div className="flex items-center gap-2 mb-5">
            <Heart size={18} className="text-[#f4196d]" fill="currentColor" />
            <h2 className="font-display text-lg font-semibold text-[#3D2635]">Your Activity</h2>
          </div>

          {matchActivity.length > 0 ? (
            <ul className="space-y-3">
              {matchActivity.map((item, i) => (
                <li key={i} className="flex items-center gap-3 wow-animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#3D2635] truncate">{item.text}</p>
                    <p className="text-[10px] text-[#A08090]">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <Heart size={28} className="mx-auto text-[#E8CDD8] mb-2" />
              <p className="text-xs text-[#8E7385]">No activity yet — start browsing profiles!</p>
              <Link
                to="/app/matches"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#FFF0F4] border border-[#FBE6EC] px-4 py-2 text-xs font-bold text-[#f4196d] transition-all hover:bg-[#FCEAF1]"
              >
                Browse Matches <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {pendingRequests > 0 && (
            <Link
              to="/app/matches?tab=interests&interest=received"
              className="mt-4 flex items-center gap-2 rounded-xl border border-[#FCEAF1] bg-[#FFF9FC] p-3 transition-colors hover:border-[#E7C6D0]"
            >
              <Heart size={14} className="text-[#f4196d]" fill="currentColor" />
              <span className="text-xs font-semibold text-[#f4196d]">
                {pendingRequests} pending interest{pendingRequests > 1 ? 's' : ''}
              </span>
              <ChevronRight size={12} className="ml-auto text-[#f4196d]" />
            </Link>
          )}
        </div>
      </section>

      {/* ═══ ALL INTERESTS (when no pending but has sent/accepted) ═══ */}
      {showMatchSection && pendingRequests === 0 && (
        <section className="rounded-2xl border border-[#EFDCE6] bg-white p-6 shadow-[0_10px_30px_rgba(244,25,109,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#3D2635]">Interest Requests</h2>
              <p className="mt-1 text-sm text-[#8E7385]">Manage interests you received or sent</p>
            </div>
            <Link
              to="/app/matches?tab=interests"
              className="text-sm font-semibold text-[#f4196d] hover:text-[#c01458] transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="rounded-xl border border-dashed border-[#E6CDD8] bg-[#FFFBFC] p-6 text-center">
            <p className="text-sm text-[#8E7385]">No pending requests right now.</p>
            <Link
              to="/app/matches"
              className="mt-2 inline-block text-sm font-medium text-[#f4196d] hover:underline"
            >
              Browse matches and send interest
            </Link>
          </div>
        </section>
      )}

      {/* ═══ MUTUAL MATCHES ═══ */}
      {acceptedCount > 0 && (
        <section className="rounded-2xl border border-[#E8D9FF] bg-gradient-to-br from-[#FAF5FF] to-[#FFF5F8] p-6 shadow-[0_10px_30px_rgba(136,96,190,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#3D2635] flex items-center gap-2">
                <Users size={20} className="text-[#8860BE]" />
                Mutual Matches
              </h2>
              <p className="mt-1 text-sm text-[#8E7385]">
                {acceptedCount} connection{acceptedCount > 1 ? 's' : ''} — start a conversation!
              </p>
            </div>
            <Link
              to="/app/chat"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8860BE] to-[#B984E5] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <MessageCircle size={13} /> Open Chat
            </Link>
          </div>
          <div className="space-y-3">
            {acceptedInterests.slice(0, 5).map((match) => (
              <InterestRequestCard key={match.id} match={match} variant="received" compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
