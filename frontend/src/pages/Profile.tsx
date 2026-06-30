import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  Pencil,
  Loader2,
  MapPin,
  Sparkles,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  LayoutGrid,
  UserCircle,
  Users,
  HeartHandshake,
} from 'lucide-react';
import api from '../lib/api';
import { calculateCompletion, getPhotoUrl, profileFromApi } from '../lib/profileUtils';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';

const TABS: { id: ProfileTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake },
];

function getAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function CompletionRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#F4E4EC" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="url(#profileRing)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="profileRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4899F" />
            <stop offset="100%" stopColor="#B66A8A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-[#B66A8A]">{value}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9A5776]">Complete</span>
      </div>
    </div>
  );
}

export default function Profile({ managedMode = false }: { managedMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const editPath = managedMode ? '/app/profile/edit/managed' : '/app/profile/edit';
  const hubPath = '/app/profile/representative/me';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-[#F4E4EC] border-t-[#B66A8A] animate-spin" />
          <Sparkles size={18} className="absolute inset-0 m-auto text-[#B66A8A]" />
        </div>
        <p className="text-sm font-medium text-[#9A5776]">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="soft-fade-in mx-auto max-w-lg py-16">
        <div className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-white shadow-[0_20px_60px_rgba(174,94,129,0.12)]">
          <div className="h-28 bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF]" />
          <div className="-mt-12 px-8 pb-10 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-[#FFF0F5] to-[#F7ECFF] shadow-lg">
              <User size={36} className="text-[#C4899F]" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-[#5D2B44]">
              {managedMode ? 'Create Managed Profile' : 'Your Story Starts Here'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#815A6D]">
              {managedMode
                ? 'Set up the bride or groom matrimonial profile for matchmaking.'
                : 'Build a beautiful profile to discover meaningful connections on WOW.'}
            </p>
            <Link
              to={editPath}
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#B66A8A] px-7 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[#A75878] hover:shadow-lg"
            >
              <Pencil size={16} />
              Create Profile
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = wizard.personalDetails || profile;
  const express = wizard.expressYourself || profile.expressYourself || {};
  const experience = wizard.experience || profile.experience || {};
  const education = wizard.education || profile.educationList || [];
  const photoUrl = getPhotoUrl(wizard.profilePhoto || profile.photos?.[0] || '');
  const displayName =
    pd.displayName || `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim();
  const location = [pd.city || profile.city, pd.state || profile.state, pd.country || profile.country]
    .filter(Boolean)
    .join(', ');
  const completion = calculateCompletion(profileFromApi(profile));
  const age = getAge(pd.dateOfBirth || profile.dateOfBirth);
  const aboutMe = express.aboutMe || profile.bio;
  const profession = experience.jobTitle || profile.occupation;
  const qualification = education[0]?.degree || education[0]?.qualification;

  return (
    <div className="soft-fade-in mx-auto max-w-5xl pb-10">
      {managedMode && (
        <Link to={hubPath} className="mb-4 inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
          <ArrowRight size={16} className="rotate-180" /> Back to My Profiles
        </Link>
      )}
      {/* Cover banner */}
      <div className="relative h-36 overflow-hidden rounded-3xl sm:h-44">
        <div className="absolute inset-0 bg-gradient-to-r from-[#E8A4BC] via-[#C99BD4] to-[#A8B8E8]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
              radial-gradient(circle at 80% 30%, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="pointer-events-none absolute -left-8 top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
      </div>

      <div className="relative -mt-16 grid gap-6 px-1 lg:grid-cols-[260px_1fr] lg:gap-8">
        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-[#F2DFE8] bg-white shadow-[0_8px_30px_rgba(174,94,129,0.1)]">
            <div className="flex justify-center bg-gradient-to-b from-[#FFF8FB] to-white px-6 pb-5 pt-8">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-[#F7ECFF] shadow-lg ring-2 ring-[#F4D8E4]">
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={40} className="text-[#C4899F]" />
                    </div>
                  )}
                </div>
                {profile.isComplete && (
                  <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#6BBF8A] text-white shadow">
                    <CheckCircle2 size={14} />
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 px-5 pb-5">
              <CompletionRing value={completion} />

              <Link
                to={editPath}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B66A8A] py-2.5 text-sm font-medium text-white transition hover:bg-[#A75878]"
              >
                <Pencil size={15} />
                Edit Profile
              </Link>

              {(pd.email || pd.phone) && (
                <div className="space-y-2 border-t border-[#F2DFE8] pt-4">
                  {pd.email && (
                    <a
                      href={`mailto:${pd.email}`}
                      className="flex items-center gap-2 rounded-lg bg-[#FFFBFC] px-3 py-2 text-xs text-[#6B4A5A] transition hover:bg-[#FFF5F8]"
                    >
                      <Mail size={13} className="shrink-0 text-[#B66A8A]" />
                      <span className="truncate">{pd.email}</span>
                    </a>
                  )}
                  {pd.phone && (
                    <a
                      href={`tel:${pd.phone}`}
                      className="flex items-center gap-2 rounded-lg bg-[#FFFBFC] px-3 py-2 text-xs text-[#6B4A5A] transition hover:bg-[#FFF5F8]"
                    >
                      <Phone size={13} className="shrink-0 text-[#B66A8A]" />
                      <span>{pd.phone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick facts */}
          <div className="rounded-2xl border border-[#F2DFE8] bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9A5776]">At a Glance</p>
            <dl className="space-y-2.5 text-sm">
              {age && (
                <div className="flex justify-between">
                  <dt className="text-[#9A5776]">Age</dt>
                  <dd className="font-medium text-[#5D2B44]">{age} years</dd>
                </div>
              )}
              {pd.height && (
                <div className="flex justify-between">
                  <dt className="text-[#9A5776]">Height</dt>
                  <dd className="font-medium text-[#5D2B44]">{pd.height} ft</dd>
                </div>
              )}
              {pd.gender && (
                <div className="flex justify-between">
                  <dt className="text-[#9A5776]">Gender</dt>
                  <dd className="font-medium capitalize text-[#5D2B44]">{pd.gender}</dd>
                </div>
              )}
              {qualification && (
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-[#9A5776]">Education</dt>
                  <dd className="truncate text-right font-medium text-[#5D2B44]">{qualification}</dd>
                </div>
              )}
              {profession && (
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-[#9A5776]">Career</dt>
                  <dd className="truncate text-right font-medium text-[#5D2B44]">{profession}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-[#F2DFE8] bg-white px-5 py-6 shadow-sm sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#5D2B44] sm:text-3xl">
                  {displayName || 'My Profile'}
                </h1>
                {location && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#815A6D]">
                    <MapPin size={14} className="text-[#B66A8A]" />
                    {location}
                  </p>
                )}
              </div>
              {profile.isComplete ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EF] px-3 py-1 text-xs font-semibold text-[#3D8B5F]">
                  <CheckCircle2 size={13} /> Verified Profile
                </span>
              ) : (
                <Link
                  to={editPath}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E6] px-3 py-1 text-xs font-semibold text-[#B45309] transition hover:bg-[#FFECD6]"
                >
                  Complete your profile →
                </Link>
              )}
            </div>

            {aboutMe && (
              <blockquote className="mt-5 border-l-4 border-[#E5C8D5] pl-4 text-sm italic leading-relaxed text-[#6B4A5A]">
                "{aboutMe}"
              </blockquote>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[#F2DFE8] bg-white p-1.5 shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition sm:gap-2 sm:px-4 ${
                  activeTab === id
                    ? 'bg-[#B66A8A] text-white shadow-md'
                    : 'text-[#815A6D] hover:bg-[#FFF5F8] hover:text-[#5D2B44]'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <ProfileDetailsView profile={profile} tab={activeTab} />
        </main>
      </div>
    </div>
  );
}
