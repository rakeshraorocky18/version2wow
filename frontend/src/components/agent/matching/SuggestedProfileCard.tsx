import { Link } from 'react-router-dom';
import { BadgeCheck, Check, Crown, Eye, Sparkles } from 'lucide-react';
import type { AgentMatchProfile } from '../../../types/agentMatching';
import CompatibilityBadge from './CompatibilityBadge';
import { getPhotoUrl } from '../../../lib/profileUtils';

interface Props {
  profile: AgentMatchProfile;
  workspaceCustomerId?: string;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-wow-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-wow-text">{value?.trim() || '—'}</dd>
    </div>
  );
}

export default function SuggestedProfileCard({ profile, workspaceCustomerId }: Props) {
  const name = profile.name || `${profile.firstName} ${profile.lastName || ''}`.trim();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const profileUrl = workspaceCustomerId
    ? `/agent/customers/${workspaceCustomerId}/profile/${profile.id}`
    : `/agent/customers/${profile.id}/profile`;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-wow-primary hover:shadow-lg">
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#FFF0F4] to-[#F7EBEF]">
        {profile.profilePhoto ? (
          <img
            src={getPhotoUrl(profile.profilePhoto || '')}
            alt={name}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-semibold text-wow-primary">
            {initials}
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-wow-primary shadow-sm">
            {profile.profileCompletion}% complete
          </span>
          {profile.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shadow-sm">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {profile.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/95 px-2 py-0.5 text-[10px] font-medium text-amber-700 shadow-sm">
              <Crown className="h-3 w-3" /> Premium
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <CompatibilityBadge score={profile.compatibilityScore} size="md" />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="truncate font-display text-lg text-wow-text">{name}</h4>
              {profile.isBestMatch && (
                <span className="rounded-full bg-wow-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  Best Match
                </span>
              )}
              {profile.isTopRecommendation && !profile.isBestMatch && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFF5F7] px-1.5 py-0.5 text-[9px] font-bold uppercase text-wow-primary">
                  <Sparkles className="h-2.5 w-2.5" /> Top
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-wow-muted">
              {[profile.age ? `${profile.age} yrs` : null, profile.gender]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          <Detail label="Religion" value={profile.religion} />
          <Detail label="Occupation" value={profile.occupation} />
          <Detail label="Education" value={profile.education} />
          <Detail label="City" value={profile.city} />
          <Detail label="Height" value={profile.height} />
          <Detail label="Marital Status" value={profile.maritalStatus} />
        </dl>

        {(profile.reasons?.length ?? 0) > 0 && (
          <ul className="space-y-1.5 rounded-xl bg-[#FFFBFC] p-3">
            {profile.reasons!.slice(0, 6).map((reason) => (
              <li key={reason} className="flex items-center gap-2 text-xs text-wow-text">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-wow-success/20 text-emerald-700">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {reason}
              </li>
            ))}
          </ul>
        )}

        <Link
          to={profileUrl}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 !py-2.5 text-sm"
        >
          <Eye className="h-4 w-4" />
          View Profile
        </Link>
      </div>
    </article>
  );
}
