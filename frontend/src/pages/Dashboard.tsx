import { Heart, MessageCircle, Store, Calendar, CheckCircle2, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const quickActions = [
  {
    icon: Heart,
    label: 'Find Matches',
    path: '/app/matches',
    description: 'Discover partners and celebrate shared values.',
    color: 'from-[#F9DEE7] to-[#F6E8FF] text-[#A4426A]',
  },
  {
    icon: MessageCircle,
    label: 'Messages',
    path: '/app/chat',
    description: 'Stay close with warm conversations and updates.',
    color: 'from-[#FDEAD8] to-[#FBE8EF] text-[#A35C3E]',
  },
  {
    icon: Store,
    label: 'Browse Vendors',
    path: '/app/vendors',
    description: 'Explore trusted local experts for each moment.',
    color: 'from-[#EFE4FF] to-[#FBE9F4] text-[#6E4A9C]',
  },
  {
    icon: Calendar,
    label: 'Plan Wedding',
    path: '/app/planner',
    description: 'Turn your timeline into beautiful milestones.',
    color: 'from-[#FEE7DB] to-[#FFF0D6] text-[#A56B2B]',
  },
  {
    icon: Gift,
    label: 'Finance Center',
    path: '/app/finance',
    description: 'Track budget, expenses, loans and gift registry.',
    color: 'from-[#E7F3FF] to-[#F1F8FF] text-[#2F6D97]',
  },
  {
    icon: Sparkles,
    label: 'Travel Packages',
    path: '/app/honeymoon',
    description: 'Explore and book honeymoon destinations instantly.',
    color: 'from-[#FFEBD6] to-[#FFF3E8] text-[#A6672A]',
  },
];

const checklistItems = [
  { label: 'Create your account', done: true, icon: CheckCircle2 },
  { label: 'Complete your profile', done: false, icon: Sparkles },
  { label: 'Start exploring matches', done: false, icon: Heart },
  { label: 'Browse wedding vendors', done: false, icon: Gift },
];

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const completedCount = checklistItems.filter((item) => item.done).length;
  const checklistProgress = Math.round((completedCount / checklistItems.length) * 100);
  const planningProgress = 24;
  const userName = user?.email ? user.email.split('@')[0] : 'Couple';

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#F2DFE8] bg-gradient-to-br from-[#FFF8FB] via-[#F8F3FF] to-[#FFF5EF] p-8 shadow-[0_15px_45px_rgba(174,94,129,0.14)] sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F4D8E4]/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#EBDDFF]/70 blur-2xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#E5C8D5] bg-white/80 px-4 py-1 text-xs font-medium tracking-wide text-[#9A5776]">
              <Sparkles size={14} /> Luxury Wedding Command Center
            </p>
            <h1 className="mt-4 text-3xl font-display font-bold leading-tight text-[#5D2B44] sm:text-4xl">
              Welcome, {userName}. Your forever story begins here.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-[#815A6D] sm:text-base">
              Design each chapter with intention, emotion, and elegance. From soulmate matches to vendor bookings,
              every detail now lives in one beautifully curated journey.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app/planner" className="btn-primary group !rounded-full !bg-[#B66A8A] hover:!bg-[#A75878]">
                Continue Planning <ArrowRight size={16} className="ml-2 inline transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/app/matches"
                className="rounded-full border border-[#D8B6C6] bg-white/80 px-5 py-3 text-sm font-medium text-[#7B4A62] transition hover:bg-white"
              >
                Explore Matches
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-[#EEDBE5] bg-white/70 p-6 backdrop-blur">
            <div className="absolute right-4 top-4 rounded-full bg-[#FDE9F2] px-3 py-1 text-xs font-semibold text-[#A75378]">
              Love Mode
            </div>
            <div className="mx-auto mt-4 h-40 w-40 rounded-full border-2 border-[#E6C7D5] bg-gradient-to-b from-[#FFF0F5] to-[#F7ECFF] p-6">
              <div className="flex h-full items-center justify-center rounded-full border border-[#D9B8C8] bg-white/80">
                <Heart size={34} className="text-[#C1698F]" fill="currentColor" />
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-[#7C5A6E]">
              "The best weddings feel effortless because every detail was planned with love."
            </p>
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
              className="group relative overflow-hidden rounded-2xl border border-[#F1E1E8] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(180,105,140,0.2)]"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color}`}>
                <Icon size={22} />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#573147]">{action.label}</h3>
              <p className="mt-2 text-sm text-[#7C6673]">{action.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#A86584]">
                Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#F0DFE7] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[#523045]">Planning Snapshot</h2>
            <span className="rounded-full bg-[#F7E4EC] px-3 py-1 text-xs font-semibold text-[#A65A7D]">Week 1</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#F4E8EE] bg-[#FFF9FC] p-4">
              <p className="text-sm text-[#8B6A79]">New Matches</p>
              <p className="mt-2 text-3xl font-display font-bold text-[#C0698F]">0</p>
            </div>
            <div className="rounded-xl border border-[#F4E8EE] bg-[#FFFAF5] p-4">
              <p className="text-sm text-[#8B6A79]">Unread Messages</p>
              <p className="mt-2 text-3xl font-display font-bold text-[#B27954]">0</p>
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

        <div className="rounded-2xl border border-[#F0DFE7] bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-[#523045]">Getting Started</h2>
          <p className="mt-1 text-sm text-[#7C6673]">A gentle checklist to keep your momentum glowing.</p>

          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 120 120" className="h-20 w-20 -rotate-90">
                <circle cx="60" cy="60" r="50" stroke="#F0DFE7" strokeWidth="12" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#C16D91"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(314 * checklistProgress) / 100} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#7A4861]">
                {checklistProgress}%
              </div>
            </div>
            <div>
              <p className="font-semibold text-[#5B354A]">{completedCount} of {checklistItems.length} complete</p>
              <p className="text-sm text-[#7C6673]">Finish these and unlock your full planning dashboard.</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {checklistItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${item.done ? 'border-[#E0F1E8] bg-[#F3FBF7]' : 'border-[#F0E3EA] bg-[#FFF9FC]'}`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${item.done ? 'bg-[#D7F0E2] text-[#2F8B62]' : 'bg-[#F5E7EE] text-[#9A6380]'}`}>
                    <Icon size={15} />
                  </div>
                  <span className={`text-sm ${item.done ? 'text-[#49745E]' : 'text-[#6F5662]'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#F0DFE7] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-[#523045]">Your Wedding Storyline</h2>
          <Link to="/app/events" className="text-sm font-semibold text-[#A86584] hover:text-[#8F4F6D]">Manage events</Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-dashed border-[#E6CDD8] bg-[#FFF8FB] p-4">
            <p className="text-xs uppercase tracking-wide text-[#AD7992]">Now</p>
            <p className="mt-2 font-semibold text-[#5C3750]">Find your perfect partners and vendors</p>
          </div>
          <div className="rounded-xl border border-dashed border-[#E6CDD8] bg-[#FDF8FF] p-4">
            <p className="text-xs uppercase tracking-wide text-[#AD7992]">Next</p>
            <p className="mt-2 font-semibold text-[#5C3750]">Build timeline, events, and budget goals</p>
          </div>
          <div className="rounded-xl border border-dashed border-[#E6CDD8] bg-[#FFFAF6] p-4">
            <p className="text-xs uppercase tracking-wide text-[#AD7992]">Then</p>
            <p className="mt-2 font-semibold text-[#5C3750]">Celebrate each curated moment with confidence</p>
          </div>
        </div>
      </section>
    </div>
  );
}
