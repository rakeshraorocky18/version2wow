import {
  Heart,
  MessageCircle,
  Star,
  Camera,
  Send,
  User,
  Search,
  Bookmark,
  Users,
  Store,
  Calendar,
  Wallet,
  PartyPopper,
  Check,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DashboardHero,
  StatsCard,
  QuickActions,
  CountdownCard,
  BudgetCard,
  PlannerTimeline,
  RecentActivity,
  VendorCarousel,
  AIAssistant,
  ProfileCompletionBanner,
  ShaadiQuickLinks,
} from '../components/dashboard';
import DashboardCard from '../components/dashboard/DashboardCard';
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import { useDashboard } from '../hooks/useDashboard';

const quickActions = [
  { icon: <Search size={20} className="text-white" />, label: 'Find Matches', to: '/app/matches', color: '', bg: '' },
  { icon: <Store size={20} className="text-white" />, label: 'Browse Vendors', to: '/app/vendors', color: '', bg: '' },
  { icon: <Store size={20} className="text-white" />, label: 'Book Vendor', to: '/app/vendors', color: '', bg: '' },
  { icon: <FileText size={20} className="text-white" />, label: 'Create Invitation', to: '/app/planner', color: '', bg: '' },
  { icon: <Calendar size={20} className="text-white" />, label: 'Wedding Planner', to: '/app/planner', color: '', bg: '' },
  { icon: <Wallet size={20} className="text-white" />, label: 'Manage Budget', to: '/app/finance', color: '', bg: '' },
  { icon: <Camera size={20} className="text-white" />, label: 'Upload Photos', to: '/app/profile/photos', color: '', bg: '' },
  { icon: <MessageCircle size={20} className="text-white" />, label: 'Chat', to: '/app/chat', color: '', bg: '' },
];

export default function Dashboard() {
  const {
    userName,
    photoUrl,
    myProfile,
    completionPct,
    missingSections,
    hasPhoto,
    planningPercent,
    daysLeft,
    weddingDateLabel,
    weddingDateSubtitle,
    nextTask,
    pendingRequests,
    acceptedCount,
    shortlistCount,
    budget,
    budgetSpentPercent,
    upcomingEventsCount,
    savedVendorsCount,
    plannerTasks,
    vendors,
    activities,
    acceptedInterests,
  } = useDashboard();

  const activityWithIcons = activities.map((item) => {
    const text = item.text.toLowerCase();
    let icon = <User size={14} />;
    if (text.includes('interest')) icon = <Heart size={14} />;
    else if (text.includes('match')) icon = <Check size={14} />;
    else if (text.includes('shortlist')) icon = <Bookmark size={14} />;
    else if (text.includes('awaiting')) icon = <Send size={14} />;
    else if (text.includes('vendor')) icon = <Store size={14} />;
    else if (text.includes('budget')) icon = <Wallet size={14} />;
    else icon = <Calendar size={14} />;
    return { ...item, icon };
  });

  return (
    <div className="datepress-dashboard datepress-matches relative -mx-4 sm:-mx-6">
      <div className="dp-member-area__shapes pointer-events-none" aria-hidden>
        <span className="dp-heart-shape dp-heart-shape--1" />
        <span className="dp-heart-shape dp-heart-shape--2" />
        <span className="dp-heart-shape dp-heart-shape--3" />
      </div>

      <motion.div
        className="dp-dash-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="dp-dash-area__inner space-y-5">
          <ProfileCompletionBanner
            completionPercent={completionPct}
            missingSections={missingSections}
            hasPhoto={hasPhoto}
          />

          <ShaadiQuickLinks />

          <DashboardHero
            userName={userName}
            userPhoto={photoUrl || undefined}
            profileCompletion={completionPct}
            isVerified={myProfile?.isVerified}
            profession={myProfile?.occupation}
            location={[myProfile?.city, myProfile?.state].filter(Boolean).join(', ') || undefined}
            planningPercent={planningPercent}
            daysUntilWedding={daysLeft}
            nextTask={nextTask}
            pendingInterests={pendingRequests}
            mutualMatches={acceptedCount}
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CountdownCard
              daysLeft={daysLeft}
              weddingDateLabel={weddingDateLabel}
              weddingDate={weddingDateSubtitle}
              totalDays={365}
            />
            <BudgetCard
              totalBudget={budget.total}
              spent={budget.spent}
              remaining={budget.remaining}
              categories={budget.categories}
            />
            <StatsCard
              icon={<Heart size={18} fill="currentColor" />}
              value={pendingRequests}
              label="Interests Received"
              subtitle="Members interested in you"
              to="/app/matches?tab=interests&interest=received"
              accent="text-[#B76E79]"
              iconBg="bg-[#FFF0F4]"
              delay={0}
              compact
            />
            <StatsCard
              icon={<MessageCircle size={18} />}
              value={acceptedCount}
              label="Active Chats"
              subtitle="Accepted connections"
              to="/app/chat"
              accent="text-[#B76E79]"
              iconBg="bg-[#FFF5F8]"
              delay={1}
              compact
            />
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              icon={<Store size={18} />}
              value={savedVendorsCount}
              label="Saved Vendors"
              subtitle="In your collection"
              to="/app/vendors"
              accent="text-[#B76E79]"
              iconBg="bg-[#FCEAF1]"
              delay={2}
            />
            <StatsCard
              icon={<PartyPopper size={18} />}
              value={upcomingEventsCount}
              label="Upcoming Events"
              subtitle="This month"
              to="/app/events"
              accent="text-[#D69BA6]"
              iconBg="bg-[#FFF5F8]"
              delay={3}
            />
            <StatsCard
              icon={<Wallet size={18} />}
              value={`${budgetSpentPercent}%`}
              label="Budget Used"
              subtitle="Of total budget"
              to="/app/finance"
              accent="text-[#F4C95D]"
              iconBg="bg-[#FFFCEF]"
              delay={4}
              animateValue={false}
            />
            <StatsCard
              icon={<Star size={18} fill="currentColor" />}
              value={shortlistCount}
              label="Shortlisted"
              subtitle="Profiles you saved"
              to="/app/matches?tab=shortlist"
              accent="text-[#F4C95D]"
              iconBg="bg-[#FFFCEF]"
              delay={5}
            />
          </section>

          <QuickActions actions={quickActions} />

          <PlannerTimeline tasks={plannerTasks} />

          {vendors.length > 0 && <VendorCarousel vendors={vendors} />}

          <section className="grid gap-4 lg:grid-cols-2">
            <RecentActivity
              activities={activityWithIcons}
              emptyCta={{ label: 'Browse Matches', to: '/app/matches' }}
              footerLink={
                pendingRequests > 0
                  ? {
                      label: `${pendingRequests} pending interest${pendingRequests > 1 ? 's' : ''}`,
                      to: '/app/matches?tab=interests&interest=received',
                    }
                  : undefined
              }
            />
            <AIAssistant />
          </section>

          {acceptedCount > 0 && (
            <DashboardCard
              className="!border-[rgba(244,25,109,0.1)] !bg-gradient-to-br from-[#ffeef1] to-[#ffffff]"
              delay={3}
            >
              <div className="dp-dash-panel-body">
                <div className="dp-dash-section-header">
                  <div>
                    <h2 className="dp-dash-section-title flex items-center gap-2">
                      <Users size={20} className="text-[#f4196d]" />
                      Mutual Matches
                    </h2>
                    <p className="dp-dash-section-subtitle">
                      {acceptedCount} connection{acceptedCount > 1 ? 's' : ''} — start a conversation!
                    </p>
                  </div>
                  <Link to="/app/chat" className="dp-connect-btn !w-auto inline-flex">
                    <MessageCircle size={13} /> Open Chat
                  </Link>
                </div>
                <div className="space-y-3">
                  {acceptedInterests.slice(0, 5).map((match) => (
                    <InterestRequestCard key={match.id} match={match} variant="received" compact />
                  ))}
                </div>
              </div>
            </DashboardCard>
          )}
        </div>
      </motion.div>
    </div>
  );
}
