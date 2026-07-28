import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Crown,
  Heart,
  Lock,
  Star,
  StickyNote,
  UserRound,
} from 'lucide-react';
import type { AgentMatchProfile, MatchViewMode } from '../../../types/agentMatching';
import CompatibilityBadge from './CompatibilityBadge';

interface Props {
  profile: AgentMatchProfile;
  /** Selected customer whose matches are being browsed */
  workspaceCustomerId: string;
  viewMode?: MatchViewMode;
  index?: number;
  locked?: boolean;
  completeProfileUrl?: string;
  onSendInterest?: (p: AgentMatchProfile) => void;
  onFavourite?: (p: AgentMatchProfile) => void;
  onNotes?: (p: AgentMatchProfile) => void;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#FAF8FB] px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-wow-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-wow-text">{value?.trim() || '—'}</dd>
    </div>
  );
}

function LockedDetail({ label }: { label: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#FAF8FB] px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-wow-muted">{label}</dt>
      <dd className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-wow-muted">
        <Lock className="h-3.5 w-3.5" />
        <span className="blur-[3px] select-none">Hidden</span>
      </dd>
    </div>
  );
}

function completionTone(value: number) {
  if (value >= 85) return 'bg-emerald-50 text-emerald-700';
  if (value >= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

export default function MatchProfileCard({
  profile,
  workspaceCustomerId,
  viewMode = 'list',
  index = 0,
  locked = false,
  completeProfileUrl = '',
  onSendInterest,
  onFavourite,
  onNotes,
}: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const name = profile.name || `${profile.firstName} ${profile.lastName || ''}`.trim();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isList = viewMode === 'list';
  const profileUrl = `/agent/customers/${workspaceCustomerId}/profile/${profile.id}`;
  const about = locked
    ? 'Sensitive details are locked until this customer profile is complete.'
    : profile.aboutMe?.trim() ||
      'Warm, family-oriented profile looking for a meaningful long-term relationship.';

  const openFullProfile = () => {
    if (!locked) navigate(profileUrl);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.36), ease: 'easeOut' }}
      whileHover={{ y: locked ? 0 : -5 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={openFullProfile}
      onKeyDown={(e) => {
        if (locked) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFullProfile();
        }
      }}
      role={locked ? 'article' : 'button'}
      tabIndex={locked ? -1 : 0}
      className={`group overflow-hidden rounded-[20px] border bg-white transition-all duration-200 ${
        locked ? 'cursor-default border-gray-100' : 'cursor-pointer'
      } ${
        !locked && hovered
          ? 'border-wow-primary shadow-[0_18px_40px_rgba(183,110,121,0.16)]'
          : 'border-gray-100 shadow-[0_6px_24px_rgba(44,38,48,0.06)]'
      } ${isList ? 'flex flex-col lg:flex-row' : 'flex flex-col'}`}
    >
      {/* Photo */}
      <div
        className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-[#FFF0F4] to-[#F7EBEF] ${
          isList ? 'h-64 w-full lg:h-auto lg:w-60 xl:w-64' : 'aspect-[4/5]'
        }`}
      >
        {profile.profilePhoto ? (
          <img
            src={profile.profilePhoto}
            alt={name}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              locked ? 'blur-[1px]' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-wow-primary">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-2xl font-semibold shadow-sm">
              {initials || <UserRound className="h-8 w-8" />}
            </div>
            <span className="text-xs font-medium text-wow-muted">No photo yet</span>
          </div>
        )}

        {locked && <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {profile.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
          {profile.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
              <Crown className="h-3.5 w-3.5" /> Premium
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <CompatibilityBadge
            score={profile.compatibilityScore}
            size="md"
            glow={!locked && hovered}
          />
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                profile.onlineStatus ? 'bg-emerald-400' : profile.recentlyActive ? 'bg-wow-primary-light' : 'bg-gray-300'
              }`}
            />
            {profile.onlineStatus
              ? 'Online'
              : profile.recentlyActive
                ? 'Recently Active'
                : 'Offline'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-2xl text-wow-text">{name}</h3>
              <p className="mt-1 text-sm text-wow-muted">
                {[
                  profile.age ? `${profile.age} yrs` : null,
                  profile.gender,
                  profile.customerCode,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${completionTone(
                profile.profileCompletion,
              )}`}
            >
              {profile.profileCompletion}% complete
            </span>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-wow-muted">{about}</p>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-wow-muted">
              Profile snapshot
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Detail label="Religion" value={profile.religion} />
              <Detail label="City" value={profile.city} />
              <Detail label="Occupation" value={profile.occupation} />
              <Detail label="Education" value={profile.education} />
              <Detail label="Marital Status" value={profile.maritalStatus} />
              <Detail label="Height" value={profile.height} />
              {locked ? (
                <>
                  <LockedDetail label="Phone" />
                  <LockedDetail label="Email" />
                  <LockedDetail label="Family" />
                </>
              ) : (
                <Detail label="Community" value={profile.community || profile.caste} />
              )}
            </dl>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-wow-muted">
              <span>Profile completion</span>
              <span className="font-semibold text-wow-text">{profile.profileCompletion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-wow-secondary/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-wow-primary to-wow-primary-light transition-all duration-500"
                style={{ width: `${Math.min(100, profile.profileCompletion)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="border-t border-gray-100 bg-[#FFFBFC] px-5 py-4"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {locked ? (
            <Link
              to={completeProfileUrl}
              className="btn-primary flex w-full items-center justify-center gap-2 !rounded-2xl !py-3 text-sm shadow-lg shadow-wow-primary/25"
            >
              <Lock className="h-4 w-4" />
              Complete Customer Profile
            </Link>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Favourite"
                  aria-label="Favourite"
                  onClick={() => onFavourite?.(profile)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-wow-muted shadow-[0_4px_14px_rgba(44,38,48,0.08)] transition-all duration-200 hover:bg-[#FFF5F7] hover:text-wow-primary hover:shadow-[0_6px_18px_rgba(183,110,121,0.2)]"
                >
                  <Star className="h-[21px] w-[21px]" />
                </button>
                <button
                  type="button"
                  title="Notes"
                  aria-label="Notes"
                  onClick={() => onNotes?.(profile)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-wow-muted shadow-[0_4px_14px_rgba(44,38,48,0.08)] transition-all duration-200 hover:bg-[#FFF5F7] hover:text-wow-primary hover:shadow-[0_6px_18px_rgba(183,110,121,0.2)]"
                >
                  <StickyNote className="h-[21px] w-[21px]" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSendInterest?.(profile)}
                className="btn-primary inline-flex flex-1 items-center justify-center gap-2 !rounded-2xl !px-5 !py-3 text-sm shadow-lg shadow-wow-primary/25 sm:flex-none"
              >
                <Heart className="h-4 w-4 fill-current" />
                Send Interest
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
