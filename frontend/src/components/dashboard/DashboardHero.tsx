import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Eye, Heart, Mail, Search, Sparkles } from 'lucide-react';

interface DashboardHeroProps {
  userName: string;
  profileCompletion: number;
  compatibilityScore: number;
  newMatches: number;
  activeConversations: number;
  daysUntilWedding: number;
  profileViews: number;
  recentInterests: number;
  nextTask: string;
}

export default function DashboardHero({
  userName,
  profileCompletion,
  compatibilityScore,
  newMatches,
  activeConversations,
  daysUntilWedding,
  profileViews,
  recentInterests,
  nextTask,
}: DashboardHeroProps) {
  const stats = [
    { label: 'Profile Completion', value: `${profileCompletion}%` },
    { label: 'Compatibility Score', value: `${compatibilityScore}%` },
    { label: 'New Matches', value: String(newMatches) },
    { label: 'Active Conversations', value: String(activeConversations) },
    { label: 'Wedding Countdown', value: daysUntilWedding > 0 ? `${daysUntilWedding} days` : 'Set date' },
    { label: 'Profile Views', value: String(profileViews) },
    { label: 'Recent Interests', value: String(recentInterests) },
  ];

  return (
    <section className="wow-dashboard-hero">
      <div className="wow-dashboard-hero__glow" aria-hidden />
      <div className="wow-dashboard-hero__content">
        <div className="wow-dashboard-hero__copy">
          <span className="wow-pill-label">
            <Sparkles size={13} />
            Premium Matchmaking Journey
          </span>
          <h1 className="wow-dashboard-hero__title">
            Welcome back, {userName} <span aria-hidden>❤️</span>
          </h1>
          <p className="wow-dashboard-hero__subtitle">
            Your journey to finding the perfect life partner is progressing beautifully.
          </p>

          <div className="wow-dashboard-hero__stats">
            {stats.map((item) => (
              <div key={item.label} className="wow-dashboard-hero__stat">
                <p className="wow-dashboard-hero__stat-label">{item.label}</p>
                <p className="wow-dashboard-hero__stat-value">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="wow-dashboard-hero__actions">
            <Link to="/app/matches" className="wow-primary-button inline-flex items-center gap-2">
              <Search size={15} />
              View Matches
              <ArrowRight size={15} />
            </Link>
            <Link to="/app/planner" className="wow-secondary-button inline-flex items-center gap-2">
              <Calendar size={15} />
              Continue Planning
            </Link>
          </div>

          <div className="wow-dashboard-hero__footer">
            <span className="inline-flex items-center gap-2">
              <Heart size={14} fill="currentColor" />
              Strong compatibility momentum this week
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail size={14} />
              {recentInterests} interests received
            </span>
            <span className="inline-flex items-center gap-2">
              <Eye size={14} />
              {profileViews} profile visits
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar size={14} />
              Next step: {nextTask}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
