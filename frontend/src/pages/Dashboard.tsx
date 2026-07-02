import {
  Heart,
  MessageCircle,
  Store,
  Calendar,
  Sparkles,
  Gift,
  ArrowRight,
  Bot,
  Wallet,
  Users,
  TrendingUp,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useMatchActions, useReceivedInterests, useSentInterests, useAcceptedInterests } from '../hooks/useMatchmaking';
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import api from '../lib/api';
import dashboardMessagesImage from '../assets/dashboard/dashboard-messages.png';
import dashboardVendorsImage from '../assets/dashboard/dashboard-vendors.png';
import dashboardPlannerImage from '../assets/dashboard/dashboard-planner.png';
import dashboardHoneymoonImage from '../assets/dashboard/dashboard-honeymoon.png';
import dashboardFindMatchesCustomImage from '../assets/dashboard/dashboard-find-matches-custom.png';
import dashboardFinanceCustomImage from '../assets/dashboard/dashboard-finance-custom.png';
import dashboardHeroWeddingStageImage from '../assets/dashboard/dashboard-hero-wedding-stage.png';

interface WeddingPlan {
  id: string;
  weddingDate: string;
  totalBudget?: number;
}

const quickActions = [
  {
    icon: Heart,
    label: 'Find Matches',
    path: '/app/matches',
    description: 'Discover your perfect partner',
    color: 'from-[#FCEAF1] to-[#F7ECFF] text-[#B15B83]',
    arrowColor: 'bg-[#E74E8A] text-white',
    image: dashboardFindMatchesCustomImage,
  },
  {
    icon: MessageCircle,
    label: 'Messages',
    path: '/app/chat',
    description: 'Chat with your matches',
    color: 'from-[#FFF1E7] to-[#FFF5EF] text-[#B67A4A]',
    arrowColor: 'bg-[#D9A63D] text-white',
    image: dashboardMessagesImage,
  },
  {
    icon: Store,
    label: 'Vendors',
    path: '/app/vendors',
    description: 'Book trusted wedding experts',
    color: 'from-[#F2ECFF] to-[#F8F1FF] text-[#7A5CAD]',
    arrowColor: 'bg-[#9A5B8C] text-white',
    image: dashboardVendorsImage,
  },
  {
    icon: Calendar,
    label: 'Planner',
    path: '/app/planner',
    description: 'Timeline & task milestones',
    color: 'from-[#EAF9F2] to-[#F2FCF7] text-[#3C956A]',
    arrowColor: 'bg-[#2F9D74] text-white',
    image: dashboardPlannerImage,
  },
  {
    icon: Gift,
    label: 'Finance',
    path: '/app/finance',
    description: 'Budget, loans & registry',
    color: 'from-[#EAF4FF] to-[#F3F8FF] text-[#3974A1]',
    arrowColor: 'bg-[#3A78A8] text-white',
    image: dashboardFinanceCustomImage,
  },
  {
    icon: Sparkles,
    label: 'Honeymoon',
    path: '/app/honeymoon',
    description: 'Dream destination packages',
    color: 'from-[#FFF4E8] to-[#FFF8EF] text-[#B17A3B]',
    arrowColor: 'bg-[#D08A38] text-white',
    image: dashboardHoneymoonImage,
  },
];

const surfaceCardClass =
  'rounded-2xl border border-[#EFDCE6] bg-white/90 p-5 shadow-[0_10px_30px_rgba(168,90,127,0.12)] backdrop-blur-sm';

const trendingInspirations = [
  'Pastel floral mandap concepts',
  'Luxury minimalist invitation suites',
  'Sangeet spotlight choreography themes',
];

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { acceptInterest, rejectInterest } = useMatchActions();
  const { data: receivedInterests = [] } = useReceivedInterests();
  const { data: sentInterests = [] } = useSentInterests();
  const { data: acceptedInterests = [] } = useAcceptedInterests();
  const pendingRequests = receivedInterests.length;
  const sentPending = sentInterests.filter((m) => m.status === 'pending').length;
  const acceptedCount = acceptedInterests.length;
  const planningProgress = 24;
  const userName = user?.email ? user.email.split('@')[0] : 'Couple';
  const { data: plans = [] } = useQuery<WeddingPlan[]>({
    queryKey: ['planner-plans'],
    queryFn: async () => {
      const { data } = await api.get<WeddingPlan[]>('/planner/plans');
      return data;
    },
  });
  const activePlan = plans[0];
  const weddingDate = activePlan?.weddingDate ? new Date(activePlan.weddingDate) : null;
  const today = new Date();
  const daysRemaining = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const budgetTotal = activePlan?.totalBudget ?? 2500000;
  const budgetUsed = Math.round(budgetTotal * 0.62);
  const budgetLeft = budgetTotal - budgetUsed;
  const budgetUsedPercent = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100));
  const showMatchSection =
    user?.role === 'bride' ||
    user?.role === 'groom' ||
    user?.role === 'representative' ||
    user?.role === 'family' ||
    pendingRequests > 0 ||
    sentInterests.length > 0 ||
    acceptedCount > 0;

  return (
    <div className="relative space-y-7 pb-4">
      <div className="pointer-events-none absolute -top-20 left-1/3 h-56 w-56 rounded-full bg-[#F9DDEA]/50 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-10 h-64 w-64 rounded-full bg-[#E8E3FF]/50 blur-3xl" />

      <section className="relative overflow-hidden rounded-3xl border border-[#EFDCE6] bg-white shadow-[0_18px_45px_rgba(174,94,129,0.16)]">
        <img
          src={dashboardHeroWeddingStageImage}
          alt="Wedding stage setup"
          className="absolute inset-y-0 right-0 h-full w-full object-cover lg:w-[48%]"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-r from-white via-white/80 to-transparent lg:w-[60%]" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F1DBE5] bg-[#FFF7FB] px-3 py-1 text-xs font-semibold tracking-[0.08em] text-[#C35A86]">
              <Sparkles size={12} /> WEDDING DASHBOARD
            </p>
            <h1 className="mt-4 text-3xl font-display font-bold leading-tight text-[#2E1D2B] sm:text-4xl">
              Hi, {userName}!
            </h1>
            <p className="mt-2 text-2xl font-medium text-[#3A2835]">Your forever story is taking shape beautifully.</p>
            <p className="mt-3 max-w-2xl text-sm text-[#6E5965] sm:text-base">
              Track your planning progress, lock your dream vendors, and connect with matches in one premium workspace
              designed to keep every important moment organized.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/app/planner"
                className="inline-flex items-center rounded-full bg-[#EA4D8B] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#D6427E]"
              >
                Continue Planning <ArrowRight size={14} className="ml-2" />
              </Link>
              <Link
                to="/app/matches"
                className="inline-flex items-center rounded-full border border-[#E9D5DF] bg-white px-5 py-2.5 text-xs font-semibold text-[#A45B7C] transition hover:bg-[#FFF7FB]"
              >
                <Heart size={14} className="mr-2" /> Explore Matches
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#F1DEE7] bg-white/95 p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCEAF1] text-[#DE568F]">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none text-[#3A2A35]">{daysRemaining ?? '--'}</p>
                    <p className="mt-1 text-xs font-medium text-[#7C6673]">Days To Wedding</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#EBE3F4] bg-white/95 p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1ECFF] text-[#8860BE]">
                    <Target size={15} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none text-[#3A2A35]">{planningProgress}%</p>
                    <p className="mt-1 text-xs font-medium text-[#7C6673]">Planning Progress</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#E5ECF7] bg-white/95 p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3FF] text-[#4D7AAF]">
                    <Users size={15} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none text-[#3A2A35]">{acceptedCount}</p>
                    <p className="mt-1 text-xs font-medium text-[#7C6673]">Mutual Matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className={`group relative overflow-hidden rounded-2xl border border-[#F1E1E8] bg-gradient-to-br ${action.color} p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(180,105,140,0.2)] min-h-[132px]`}
            >
              <img
                src={action.image}
                alt={`${action.label} preview`}
                className="absolute inset-y-0 right-0 h-full w-[45%] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-y-0 right-[43%] w-24 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />

              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/60">
                <Icon size={16} />
              </div>
              <h3 className="font-display text-[20px] leading-tight font-semibold text-[#3E2A38]">{action.label}</h3>
              <p className="mt-1.5 text-xs text-[#6F5B66]">{action.description}</p>
              <span className="mt-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-transform group-hover:translate-x-1 group-hover:scale-105">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${action.arrowColor}`}>
                  <ArrowRight size={12} />
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[#523045]">Activity Snapshot</h2>
            <span className="rounded-full bg-[#F7E4EC] px-3 py-1 text-xs font-semibold text-[#A65A7D]">This Week</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#F4E8EE] bg-[#FFF9FC] p-4">
              <p className="text-sm text-[#8B6A79]">New Requests</p>
              <p className="mt-2 text-3xl font-display font-bold text-[#C0698F]">{pendingRequests}</p>
            </div>
            <div className="rounded-xl border border-[#F4E8EE] bg-[#FFFAF5] p-4">
              <p className="text-sm text-[#8B6A79]">Sent (Pending)</p>
              <p className="mt-2 text-3xl font-display font-bold text-[#B27954]">{sentPending}</p>
            </div>
            <div className="rounded-xl border border-[#F4E8EE] bg-[#F8F6FF] p-4">
              <p className="text-sm text-[#8B6A79]">Planning Progress</p>
              <p className="mt-2 text-3xl font-display font-bold text-[#7D60B8]">{planningProgress}%</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#EFE0E8] bg-gradient-to-r from-[#FFF6FA] to-[#FAF5FF] p-4">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-[#6A4257]">Journey completion</p>
              <p className="font-semibold text-[#9A5776]">{planningProgress}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#D980A4] to-[#A877D1] transition-all duration-700"
                style={{ width: `${planningProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={surfaceCardClass}>
          <div className="flex items-center gap-2 text-[#5C3550]">
            <Bot size={18} />
            <h3 className="font-display text-lg font-semibold">AI Wedding Agent</h3>
          </div>
          <p className="mt-2 text-sm text-[#7C6673]">Ask for vendor ideas, rituals checklist, and schedule suggestions instantly.</p>
          <button className="mt-4 rounded-full bg-[#B66A8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A75878]">
            Chat with AI Agent
          </button>
        </div>

        <div className={surfaceCardClass}>
          <div className="flex items-center gap-2 text-[#5C3550]">
            <Wallet size={18} />
            <h3 className="font-display text-lg font-semibold">Budget Overview</h3>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[#6F5966]">
            <p>Total Budget: <span className="font-semibold text-[#5C3550]">₹{budgetTotal.toLocaleString()}</span></p>
            <p>Used: <span className="font-semibold text-[#B85F87]">₹{budgetUsed.toLocaleString()}</span></p>
            <p>Remaining: <span className="font-semibold text-[#2F8B62]">₹{budgetLeft.toLocaleString()}</span></p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-[#F4E7EE]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#D980A4] to-[#A877D1]"
              style={{ width: `${budgetUsedPercent}%` }}
            />
          </div>
        </div>

        <div className={surfaceCardClass}>
          <div className="flex items-center gap-2 text-[#5C3550]">
            <Users size={18} />
            <h3 className="font-display text-lg font-semibold">Guest Management</h3>
          </div>
          <p className="mt-2 text-sm text-[#7C6673]">Track RSVPs, meal preferences, and priority family invites in one place.</p>
          <Link to="/app/events" className="mt-4 inline-flex text-sm font-semibold text-[#A86584] hover:text-[#8F4F6D]">
            Open guest planner →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={surfaceCardClass}>
          <div className="flex items-center gap-2 text-[#5C3550]">
            <TrendingUp size={18} />
            <h3 className="font-display text-lg font-semibold">Trending Inspirations</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[#6E5865]">
            {trendingInspirations.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>

      {showMatchSection && (
        <section className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#523045]">Interest Requests</h2>
              <p className="mt-1 text-sm text-[#7C6673]">
                {pendingRequests > 0
                  ? `You have ${pendingRequests} new interest request${pendingRequests > 1 ? 's' : ''}`
                  : 'Manage interests you received or sent'}
              </p>
            </div>
            <Link
              to="/app/matches?tab=interests&interest=received"
              className="text-sm font-semibold text-[#A86584] hover:text-[#8F4F6D]"
            >
              View all interests →
            </Link>
          </div>

          {pendingRequests > 0 ? (
            <div className="mt-5 space-y-3">
              {receivedInterests.slice(0, 5).map((match) => (
                <InterestRequestCard
                  key={match.id}
                  match={match}
                  variant="received"
                  compact
                  onAccept={async () => {
                    await acceptInterest.mutateAsync(match.id);
                    toast.success('Interest accepted — you can chat now');
                  }}
                  onReject={async () => {
                    await rejectInterest.mutateAsync(match.id);
                    toast.success('Interest declined');
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[#E6CDD8] bg-[#FFFBFC] p-6 text-center">
              <p className="text-sm text-[#7C6673]">No pending requests right now.</p>
              <Link to="/app/matches" className="mt-2 inline-block text-sm font-medium text-[#B66A8A] hover:underline">
                Browse matches and send interest
              </Link>
            </div>
          )}
        </section>
      )}

      {acceptedCount > 0 && (
        <section className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#523045]">Mutual Matches</h2>
              <p className="mt-1 text-sm text-[#7C6673]">
                {acceptedCount} mutual match{acceptedCount > 1 ? 'es' : ''} — view profiles and start chatting
              </p>
            </div>
            <Link
              to="/app/matches?tab=interests&interest=accepted"
              className="text-sm font-semibold text-[#A86584] hover:text-[#8F4F6D]"
            >
              View all →
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {acceptedInterests.slice(0, 5).map((match) => (
              <InterestRequestCard key={match.id} match={match} variant="received" compact />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
