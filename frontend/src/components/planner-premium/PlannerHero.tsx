import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarHeart, MapPin, Palette, User } from 'lucide-react';
import FloatingParticles from './FloatingParticles';
import DonutChart from './DonutChart';
import type { PlannerCountdown } from '../../types/plannerDashboard';
import { formatWeddingDate } from '../../lib/plannerUtils';

interface PlannerHeroProps {
  userName: string;
  partnerName: string;
  weddingDate: string;
  venue: string;
  theme: string;
  daysRemaining: number;
  progressPercentage: number;
  quote: string;
  countdown?: PlannerCountdown;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/20 px-3 py-2 backdrop-blur-sm sm:px-4">
      <span className="font-display text-2xl font-bold text-white sm:text-3xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{label}</span>
    </div>
  );
}

export default function PlannerHero({
  userName,
  partnerName,
  weddingDate,
  venue,
  theme,
  daysRemaining,
  progressPercentage,
  quote,
  countdown,
}: PlannerHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="wow-gradient-hero relative overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-10"
    >
      <FloatingParticles />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-romantic-champagne/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-medium text-white/90">
            Welcome back, <span className="font-semibold">{userName}</span> ❤️
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {Math.max(daysRemaining, 0)} days until your big day 💍
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <CalendarHeart size={14} />
              Wedding Date: {formatWeddingDate(weddingDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <User size={14} />
              Partner: {partnerName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <MapPin size={14} />
              Venue: {venue}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <Palette size={14} />
              Theme: {theme}
            </span>
          </div>

          <blockquote className="max-w-xl border-l-2 border-white/40 pl-4 text-sm italic text-white/85 sm:text-base">
            &ldquo;{quote}&rdquo;
          </blockquote>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/app/planner" className="wow-btn-romantic inline-flex items-center gap-2">
              Continue Planning
            </Link>
            <Link to="/app/vendors" className="wow-btn-outline inline-flex items-center gap-2">
              Explore Vendors
            </Link>
            <Link to="/app/events" className="wow-btn-outline inline-flex items-center gap-2">
              View Invitations
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          {countdown && daysRemaining > 0 && (
            <div className="flex gap-2 sm:gap-3">
              <CountdownUnit value={countdown.daysRemaining} label="Days" />
              <CountdownUnit value={countdown.hours} label="Hours" />
              <CountdownUnit value={countdown.minutes} label="Min" />
              <CountdownUnit value={countdown.seconds} label="Sec" />
            </div>
          )}
          <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-md">
            <DonutChart percentage={progressPercentage} size={140} label="Progress" />
            <p className="mt-2 text-center text-xs font-medium text-white/80">Planning Progress</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
