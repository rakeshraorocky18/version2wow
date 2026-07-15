import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BadgeCheck,
  Crown,
  FileText,
  Heart,
  Star,
  StickyNote,
  UserRound,
} from 'lucide-react';
import { useAgentMatchProfile } from '../../hooks/agent/useAgent';
import { displayValue } from '../../lib/agent/addCustomerUtils';
import CompatibilityBadge from '../../components/agent/matching/CompatibilityBadge';
import {
  ErrorState,
  ProfileProgress,
  TableSkeleton,
} from '../../components/agent/AgentUI';
import { ReviewRow } from '../../components/agent/addCustomer/WizardUI';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal Information' },
  { id: 'family', label: 'Family Details' },
  { id: 'education', label: 'Education' },
  { id: 'career', label: 'Career' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'partner', label: 'Partner Preferences' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity Timeline' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export default function MatchFullProfile() {
  const { customerId = '', matchedProfileId = '' } = useParams();
  const [tab, setTab] = useState<TabId>('overview');
  const { data, isLoading, isError } = useAgentMatchProfile(
    customerId,
    matchedProfileId,
  );

  const profile = data?.profile;
  const documents = data?.documents || [];

  const personal = useMemo(
    () => asRecord(profile?.personalDetails),
    [profile?.personalDetails],
  );
  const family = useMemo(
    () => asRecord(profile?.familyDetails),
    [profile?.familyDetails],
  );
  const education = useMemo(
    () => asRecord(profile?.educationDetails),
    [profile?.educationDetails],
  );
  const religion = useMemo(
    () => asRecord(profile?.religionDetails),
    [profile?.religionDetails],
  );
  const partner = useMemo(
    () => asRecord(profile?.partnerPreferences),
    [profile?.partnerPreferences],
  );

  if (isLoading) return <TableSkeleton rows={10} />;
  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          to={`/agent/customers/${customerId}`}
          className="inline-flex items-center gap-1 text-sm text-wow-muted hover:text-wow-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Matching Profiles
        </Link>
        <ErrorState message="Matched profile not found." />
      </div>
    );
  }

  const name = profile.name || `${profile.firstName} ${profile.lastName || ''}`.trim();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <Link
        to={`/agent/customers/${customerId}`}
        className="inline-flex items-center gap-1.5 text-sm text-wow-muted transition hover:text-wow-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Matching Profiles
      </Link>

      {/* Header */}
      <section
        className="overflow-hidden rounded-[20px] border border-gray-100 bg-white"
        style={{ boxShadow: '0 8px 28px rgba(182, 106, 138, 0.08)' }}
      >
        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <div className="relative min-h-[280px] bg-gradient-to-br from-[#FFF0F4] to-[#F7EBEF]">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-wow-primary">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/85 text-3xl font-semibold shadow-sm">
                  {initials || <UserRound className="h-10 w-10" />}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-3xl text-wow-text sm:text-4xl">{name}</h1>
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
                <CompatibilityBadge score={profile.compatibilityScore} size="lg" />
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
                {profile.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Crown className="h-3.5 w-3.5" /> Premium
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-wow-bg px-2.5 py-1 text-xs font-medium text-wow-muted">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      profile.onlineStatus ? 'bg-emerald-400' : 'bg-gray-300'
                    }`}
                  />
                  {profile.onlineStatus
                    ? 'Online'
                    : profile.recentlyActive
                      ? 'Recently Active'
                      : 'Offline'}
                </span>
              </div>

              <div className="max-w-md">
                <ProfileProgress value={profile.profileCompletion} />
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-wow-muted">
                {profile.aboutMe?.trim() ||
                  'Profile available for agent review and recommendation.'}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => toast.success(`${name} added to favourites`)}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-wow-primary/30 hover:text-wow-primary"
              >
                <Star className="h-4 w-4" /> Favourite
              </button>
              <button
                type="button"
                onClick={() => toast.success(`Interest sent to ${name}`)}
                className="btn-primary inline-flex items-center gap-2 !rounded-2xl !px-5 !py-2.5 text-sm shadow-lg shadow-wow-primary/25"
              >
                <Heart className="h-4 w-4 fill-current" /> Send Interest
              </button>
              <button
                type="button"
                onClick={() => toast.success('Internal note draft started')}
                className="inline-flex items-center gap-2 rounded-2xl border border-wow-primary/25 bg-[#FFF5F7] px-4 py-2.5 text-sm font-medium text-wow-primary transition hover:bg-wow-primary/10"
              >
                <StickyNote className="h-4 w-4" /> Internal Notes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-[20px] border border-gray-100 bg-white p-1.5 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-wow-primary text-white shadow-sm'
                  : 'text-wow-muted hover:bg-[#FFF5F7] hover:text-wow-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section
        className="rounded-[20px] border border-gray-100 bg-white p-6"
        style={{ boxShadow: '0 4px 24px rgba(182, 106, 138, 0.06)' }}
      >
        {tab === 'overview' && (
          <dl className="grid gap-1 sm:grid-cols-2">
            <ReviewRow label="Religion" value={profile.religion || ''} />
            <ReviewRow label="Caste / Community" value={profile.community || profile.caste || ''} />
            <ReviewRow label="City" value={profile.city || ''} />
            <ReviewRow label="Occupation" value={profile.occupation || ''} />
            <ReviewRow label="Education" value={profile.education || ''} />
            <ReviewRow label="Marital Status" value={profile.maritalStatus || ''} />
            <ReviewRow label="Height" value={profile.height || ''} />
            <ReviewRow label="Compatibility" value={`${profile.compatibilityScore}%`} />
            {(profile.reasons?.length ?? 0) > 0 && (
              <div className="sm:col-span-2 mt-4 rounded-2xl bg-[#FFFBFC] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wow-muted">
                  Compatibility reasons
                </p>
                <ul className="space-y-1.5">
                  {profile.reasons!.map((reason) => (
                    <li key={reason} className="text-sm text-wow-text">
                      ✓ {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </dl>
        )}

        {tab === 'personal' && (
          <dl>
            <ReviewRow label="Phone" value={profile.phone || ''} />
            <ReviewRow label="Email" value={profile.email || ''} />
            <ReviewRow label="Gender" value={profile.gender || ''} />
            <ReviewRow label="Date of Birth" value={profile.dateOfBirth || ''} />
            <ReviewRow label="Mother Tongue" value={profile.motherTongue || ''} />
            <ReviewRow label="Address" value={profile.address || ''} />
            <ReviewRow
              label="Communication Address"
              value={displayValue(personal.communicationAddress)}
            />
            <ReviewRow label="Marital Status" value={String(personal.maritalStatus || profile.maritalStatus || '')} />
            <ReviewRow label="Height" value={String(personal.height || profile.height || '')} />
            <ReviewRow label="Weight" value={String(personal.weight || '')} />
          </dl>
        )}

        {tab === 'family' && (
          <dl>
            <ReviewRow label="Father" value={String(family.fatherName || '')} />
            <ReviewRow label="Mother" value={String(family.motherName || '')} />
            <ReviewRow label="Brothers" value={displayValue(family.brothers)} />
            <ReviewRow label="Sisters" value={displayValue(family.sisters)} />
            <ReviewRow label="Family Type" value={String(family.familyType || '')} />
            <ReviewRow label="Family Status" value={String(family.familyStatus || '')} />
            <ReviewRow label="Family Assets" value={displayValue(family.familyAssets)} />
          </dl>
        )}

        {tab === 'education' && (
          <dl>
            <ReviewRow label="Education" value={profile.education || ''} />
            <ReviewRow label="Highest Qualification" value={String(education.highestQualification || education.qualification || '')} />
            <ReviewRow label="College / University" value={String(education.college || education.university || '')} />
            <ReviewRow label="Field of Study" value={String(education.fieldOfStudy || '')} />
          </dl>
        )}

        {tab === 'career' && (
          <dl>
            <ReviewRow label="Occupation" value={profile.occupation || ''} />
            <ReviewRow label="Company" value={String(education.company || '')} />
            <ReviewRow label="Annual Income" value={String(education.annualIncome || '')} />
            <ReviewRow label="Work Location" value={String(education.workLocation || '')} />
          </dl>
        )}

        {tab === 'lifestyle' && (
          <dl>
            <ReviewRow label="Diet" value={String(personal.foodPreference || personal.diet || '')} />
            <ReviewRow label="Smoking" value={String(personal.smoking || '')} />
            <ReviewRow label="Drinking" value={String(personal.drinking || '')} />
            <ReviewRow label="Religion" value={profile.religion || ''} />
            <ReviewRow label="Gothra" value={String(religion.gothra || personal.gothram || '')} />
            <ReviewRow label="Star" value={String(religion.star || personal.star || '')} />
            <ReviewRow label="Rasi" value={String(religion.rasi || personal.rasi || '')} />
          </dl>
        )}

        {tab === 'partner' && (
          <dl>
            <ReviewRow label="Age Range" value={String(partner.ageRange || '')} />
            <ReviewRow label="Preferred Religion" value={String(partner.religion || '')} />
            <ReviewRow label="Preferred Caste" value={String(partner.caste || '')} />
            <ReviewRow label="Education" value={String(partner.education || '')} />
            <ReviewRow label="Occupation" value={String(partner.profession || partner.occupation || '')} />
            <ReviewRow label="Location" value={String(partner.locationPreference || partner.city || '')} />
            <ReviewRow label="Expectations" value={String(partner.otherExpectations || partner.notes || '')} />
          </dl>
        )}

        {tab === 'documents' && (
          <div className="space-y-3">
            {!documents.length ? (
              <p className="text-sm text-wow-muted">No documents available for this profile.</p>
            ) : (
              documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#FAF8FB] px-4 py-3 text-sm transition hover:border-wow-primary/30"
                >
                  <FileText className="h-4 w-4 text-wow-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-wow-text">{doc.fileName}</p>
                    <p className="text-xs capitalize text-wow-muted">{doc.type.replace(/_/g, ' ')}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-wow-muted">
            Activity timeline for matched profiles will appear here as interests and notes are
            logged.
          </div>
        )}
      </section>
    </motion.div>
  );
}
