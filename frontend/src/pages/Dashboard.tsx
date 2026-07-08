import {
  Heart,
  MessageCircle,
  Star,
  Camera,
  Send,
  Search,
  Store,
  Calendar,
  Wallet,
  PartyPopper,
  Eye,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  DashboardHero,
  StatsCard,
  QuickActions,
  CountdownCard,
  BudgetCard,
  PlannerTimeline,
  VendorCarousel,
  AIAssistant,
  ProfileCompletionBanner,
  ShaadiQuickLinks,
  // CompatibilityInsightsCard,
} from '../components/dashboard';
import DashboardCard from '../components/dashboard/DashboardCard';
import FeaturedMatchCard from '../components/dashboard/FeaturedMatchCard';
import RelationshipJourneyCard from '../components/dashboard/RelationshipJourneyCard';
import SuccessStoriesCarousel from '../components/dashboard/SuccessStoriesCarousel';
import RecommendedMatchesShowcase from '../components/dashboard/RecommendedMatchesShowcase';
import RecentInterestMoments from '../components/dashboard/RecentInterestMoments';
import MatchmakingSnapshotBar from '../components/dashboard/MatchmakingSnapshotBar';
import ProfileVisitorsCard from '../components/dashboard/ProfileVisitorsCard';
import PremiumUpgradeCard from '../components/dashboard/PremiumUpgradeCard';
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import { useDashboard, type DashboardProfileCardData } from '../hooks/useDashboard';
import { useMatchActions } from '../hooks/useMatchmaking';

const quickActions = [
  { icon: <Search size={20} className="text-white" />, label: 'Find Matches', to: '/app/matches', color: '', bg: '' },
  { icon: <Heart size={20} className="text-white" />, label: 'Browse Profiles', to: '/app/matches?tab=search', color: '', bg: '' },
  { icon: <MessageCircle size={20} className="text-white" />, label: 'Chat', to: '/app/chat', color: '', bg: '' },
  { icon: <Calendar size={20} className="text-white" />, label: 'Wedding Planner', to: '/app/planner', color: '', bg: '' },
  { icon: <Store size={20} className="text-white" />, label: 'Browse Vendors', to: '/app/vendors', color: '', bg: '' },
  { icon: <Wallet size={20} className="text-white" />, label: 'Manage Budget', to: '/app/finance', color: '', bg: '' },
  { icon: <Camera size={20} className="text-white" />, label: 'Upload Photos', to: '/app/profile/photos', color: '', bg: '' },
  { icon: <Send size={20} className="text-white" />, label: 'Create Invitation', to: '/app/events/new', color: '', bg: '' },
];

export default function Dashboard() {
  const { sendInterest, acceptInterest, rejectInterest } = useMatchActions();
  const {
    userName,
    myProfile,
    completionPct,
    missingSections,
    hasPhoto,
    daysLeft,
    weddingDateLabel,
    weddingDateSubtitle,
    nextTask,
    pendingRequests,
    acceptedCount,
    shortlistCount,
    newMatchesCount,
    highestCompatibility,
    profileViewsCount,
    budget,
    upcomingEventsCount,
    savedVendorsCount,
    plannerTasks,
    vendors,
    receivedInterests,
    userCity,
    recommendedMatches,
    featuredMatches,
    featuredMatch,
    ownProfileCard,
    profileVisitors,
    profileVisitorsGrowth,
    compatibilityScore,
    compatibilityInsights,
    recentMoments,
    journeySteps,
    sentInterestUserIds,
    connectedUserIds,
    activeConversationsCount,
  } = useDashboard();

  const matchmakingStats = [
    {
      icon: <Heart size={18} fill="currentColor" />,
      value: newMatchesCount,
      label: 'New Matches',
      subtitle: 'Compatible profiles',
      to: '/app/matches?tab=suggestions',
      animateValue: true,
    },
    {
      icon: <Send size={18} />,
      value: pendingRequests,
      label: 'Interests Received',
      subtitle: 'Pending requests',
      to: '/app/matches?tab=interests&interest=received',
      animateValue: true,
    },
    {
      icon: <MessageCircle size={18} />,
      value: activeConversationsCount,
      label: 'Active Conversations',
      subtitle: 'Ongoing chats',
      to: '/app/chat',
      animateValue: true,
    },
    {
      icon: <Flame size={18} />,
      value: `${highestCompatibility || compatibilityScore}%`,
      label: 'Highest Compatibility',
      subtitle: 'Best match today',
      to: featuredMatch?.profilePath || '/app/matches?tab=suggestions',
      animateValue: false,
    },
    {
      icon: <Eye size={18} />,
      value: profileViewsCount,
      label: 'Profile Views',
      subtitle: 'Today',
      to: '/app/profile',
      animateValue: true,
    },
    {
      icon: <Star size={18} fill="currentColor" />,
      value: shortlistCount,
      label: 'Saved Profiles',
      subtitle: 'Favorites',
      to: '/app/matches?tab=shortlist',
      animateValue: true,
    },
    {
      icon: <Heart size={18} />,
      value: acceptedCount,
      label: 'Mutual Connections',
      subtitle: 'Accepted interests',
      to: '/app/chat',
      animateValue: true,
    },
    {
      icon: <PartyPopper size={18} />,
      value: upcomingEventsCount,
      label: 'Upcoming Events',
      subtitle: 'Wedding milestones',
      to: '/app/events',
      animateValue: true,
    },
  ];

  const handleSendInterest = async (profile: DashboardProfileCardData) => {
    if (!profile.userId) {
      toast.error('Unable to send interest for this profile');
      return;
    }

    try {
      await sendInterest.mutateAsync(profile.userId);
      toast.success(`Interest sent to ${profile.firstName}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not send interest');
    }
  };

  const handleAcceptInterest = async (matchId: string) => {
    try {
      await acceptInterest.mutateAsync(matchId);
      toast.success('Interest accepted');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not accept interest');
    }
  };

  const handleRejectInterest = async (matchId: string) => {
    try {
      await rejectInterest.mutateAsync(matchId);
      toast.success('Interest declined');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not decline interest');
    }
  };

  return (
    <div className="wow-luxe-dashboard datepress-dashboard relative -mx-4 sm:-mx-6">
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
        <div className="dp-dash-area__inner space-y-3 lg:space-y-4">
          <MatchmakingSnapshotBar
            newMatches={newMatchesCount}
            newInterests={pendingRequests}
            newReplies={activeConversationsCount}
            profileViews={profileViewsCount}
          />

          <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.92fr)]">
            <DashboardHero
              userName={userName}
              profileCompletion={completionPct}
              compatibilityScore={compatibilityScore}
              newMatches={newMatchesCount}
              activeConversations={activeConversationsCount}
              daysUntilWedding={daysLeft}
              profileViews={profileViewsCount}
              recentInterests={pendingRequests}
              nextTask={nextTask}
            />
            <FeaturedMatchCard profile={ownProfileCard} />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {matchmakingStats.map((stat, index) => (
              <StatsCard
                key={stat.label}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                subtitle={stat.subtitle}
                to={stat.to}
                accent="text-[#B76E79]"
                iconBg="bg-[#FFF0F4]"
                delay={index}
                animateValue={stat.animateValue}
              />
            ))}
          </section>

          <ShaadiQuickLinks completionPercent={completionPct} />

          <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,0.96fr)_minmax(300px,0.78fr)_minmax(280px,0.72fr)]">
            <ProfileCompletionBanner
              completionPercent={completionPct}
              missingSections={missingSections}
              hasPhoto={hasPhoto}
              isVerified={myProfile?.isVerified}
            />
            <ProfileVisitorsCard
              viewsCount={profileViewsCount}
              growthPercent={profileVisitorsGrowth}
              visitors={profileVisitors}
            />
          </section>

          <RecommendedMatchesShowcase
            matches={recommendedMatches}
            sentInterestUserIds={sentInterestUserIds}
            connectedUserIds={connectedUserIds}
            onSendInterest={handleSendInterest}
          />

          <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
            <DashboardCard className="wow-recent-interests-card" delay={6}>
              <div className="dp-dash-panel-body">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="wow-section-kicker">Recent Interests</p>
                    <h2 className="wow-section-title">Live activity on your profile</h2>
                    <p className="wow-section-subtitle">
                      Review the newest people who have already started a conversation with you.
                    </p>
                  </div>
                </div>
                {receivedInterests.length > 0 ? (
                  <div className="space-y-3">
                    {receivedInterests.slice(0, 3).map((match) => (
                      <InterestRequestCard
                        key={match.id}
                        match={match}
                        variant="received"
                        compact
                        onAccept={() => handleAcceptInterest(match.id)}
                        onReject={() => handleRejectInterest(match.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="wow-empty-state">
                    <p className="text-sm font-medium text-[#2C2630]">
                      No interests yet.
                    </p>
                    <p className="mt-1 text-sm text-[#6B6670]">
                      Complete your profile to unlock more visibility and receive better responses.
                    </p>
                  </div>
                )}
              </div>
            </DashboardCard>
            <RecentInterestMoments moments={recentMoments} />
          </section>

          <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <QuickActions actions={quickActions} />
            <div className="grid gap-3">
              <RelationshipJourneyCard steps={journeySteps} />
              <PremiumUpgradeCard />
            </div>
          </section>

          <section className="grid items-start gap-3 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
            <AIAssistant />
            <SuccessStoriesCarousel />
          </section>

          <section className="wow-planning-section">
            <div className="wow-planning-section__header">
              <div>
                <p className="wow-section-kicker">Wedding Planning</p>
                <h2 className="wow-section-title">Planning stays beautifully in motion</h2>
                <p className="wow-section-subtitle">
                  Once the connection feels right, the next chapter of your journey is already ready.
                </p>
              </div>
              <div className="wow-planning-section__meta">
                <span>Saved Vendors: {savedVendorsCount}</span>
                <span>{weddingDateLabel}</span>
                <span>{weddingDateSubtitle}</span>
              </div>
            </div>

            <section className="grid items-start gap-3 xl:grid-cols-[280px_minmax(320px,0.86fr)_minmax(0,1.18fr)]">
              <CountdownCard
                daysLeft={daysLeft}
                weddingDateLabel={weddingDateLabel}
                weddingDate={weddingDateSubtitle}
                totalDays={365}
              />
              <BudgetCard
                className="wow-budget-card"
                totalBudget={budget.total}
                spent={budget.spent}
                remaining={budget.remaining}
                categories={budget.categories}
              />
              <PlannerTimeline className="wow-planner-timeline-card" tasks={plannerTasks} />
            </section>
          </section>

          {(vendors.length > 0 || Boolean(userCity)) && (
            <VendorCarousel vendors={vendors} locationLabel={userCity} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
