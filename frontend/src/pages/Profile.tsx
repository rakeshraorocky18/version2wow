import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  Pencil,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  UserCircle,
  Users,
  HeartHandshake,
  GraduationCap,
  Briefcase,
  Sparkles,
  Calendar,
  Ruler,
  BookOpen,
} from 'lucide-react';
import api from '../lib/api';
import { calculateCompletion, getPhotoUrl, profileFromApi } from '../lib/profileUtils';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';

const TABS: { id: ProfileTab; label: string; icon: typeof UserCircle }[] = [
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Work', icon: Briefcase },
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
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg className="h-[72px] w-[72px] -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#F4E4EC" strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#B66A8A"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-[#B66A8A]">{value}%</span>
      </div>
    </div>
  );
}

export default function Profile({ managedMode = false }: { managedMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
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
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#B66A8A] px-7 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[#A75878]"
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
  const religion = wizard.religion || profile;
  const experience = wizard.experience || profile.experience || {};
  const education = wizard.education || profile.educationList || [];
  const photoUrl = getPhotoUrl(wizard.profilePhoto || profile.photos?.[0] || '');
  const fullName = `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim();
  const displayName = pd.displayName || fullName || 'My Profile';
  const location = [pd.city || profile.city, pd.state || profile.state, pd.country || profile.country]
    .filter(Boolean)
    .join(', ');
  const completion = calculateCompletion(profileFromApi(profile));
  const age = getAge(pd.dateOfBirth || profile.dateOfBirth);
  const profession = experience.jobTitle || profile.occupation;
  const qualification = education[0]?.degree || education[0]?.qualification || profile.highestQualification;

  const highlights = [
    age ? { icon: Calendar, label: 'Age', value: `${age} yrs` } : null,
    pd.gender ? { icon: User, label: 'Gender', value: String(pd.gender) } : null,
    pd.height ? { icon: Ruler, label: 'Height', value: `${pd.height} ft` } : null,
    religion.religion || profile.religion
      ? { icon: BookOpen, label: 'Religion', value: religion.religion || profile.religion }
      : null,
  ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

  return (
    <div className="soft-fade-in mx-auto max-w-6xl pb-12">
      {managedMode && (
        <Link to={hubPath} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#B66A8A] hover:underline">
          <ArrowRight size={16} className="rotate-180" /> Back to My Profiles
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Sidebar profile card */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-[#F0DFE7] bg-white shadow-[0_8px_30px_rgba(174,94,129,0.08)]">
            <div className="relative h-20 bg-gradient-to-br from-[#E8A4BC] via-[#C99BD4] to-[#A8B8E8]" />

            <div className="relative px-5 pb-5">
              <div className="-mt-12 flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-[#F7ECFF] shadow-lg">
                    {photoUrl ? (
                      <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User size={36} className="text-[#C4899F]" />
                      </div>
                    )}
                  </div>
                  {profile.isComplete && (
                    <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                      <CheckCircle2 size={14} />
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 text-center">
                <h1 className="font-display text-xl font-bold text-[#5D2B44]">{displayName}</h1>
                {fullName && fullName !== displayName && (
                  <p className="mt-0.5 text-xs text-[#9A5776]">{fullName}</p>
                )}
                {location && (
                  <p className="mt-2 flex items-center justify-center gap-1 text-xs text-[#815A6D]">
                    <MapPin size={12} className="shrink-0 text-[#B66A8A]" />
                    {location}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-center gap-4">
                <CompletionRing value={completion} />
                <div className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9A5776]">Profile</p>
                  <p className="font-display text-sm font-semibold text-[#5D2B44]">
                    {profile.isComplete ? 'Complete' : 'In progress'}
                  </p>
                  {!profile.isComplete && (
                    <Link to={editPath} className="mt-1 inline-block text-xs font-medium text-[#B66A8A] hover:underline">
                      Complete profile →
                    </Link>
                  )}
                </div>
              </div>

              <Link
                to={editPath}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#B66A8A] py-2.5 text-sm font-semibold text-white transition hover:bg-[#A75878]"
              >
                <Pencil size={15} />
                Edit Profile
              </Link>

              {highlights.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-[#F2DFE8] pt-5">
                  {highlights.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#9A5776]">
                        <Icon size={14} className="text-[#B66A8A]" />
                        {label}
                      </span>
                      <span className="font-medium capitalize text-[#5D2B44]">{value}</span>
                    </div>
                  ))}
                  {qualification && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#9A5776]">
                        <GraduationCap size={14} className="text-[#B66A8A]" />
                        Education
                      </span>
                      <span className="max-w-[120px] truncate text-right font-medium text-[#5D2B44]">{qualification}</span>
                    </div>
                  )}
                  {profession && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#9A5776]">
                        <Briefcase size={14} className="text-[#B66A8A]" />
                        Work
                      </span>
                      <span className="max-w-[120px] truncate text-right font-medium text-[#5D2B44]">{profession}</span>
                    </div>
                  )}
                </div>
              )}

              {(pd.email || pd.phone || profile.email || profile.phone) && (
                <div className="mt-5 space-y-2 border-t border-[#F2DFE8] pt-5">
                  {(pd.email || profile.email) && (
                    <a
                      href={`mailto:${pd.email || profile.email}`}
                      className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-[#6B4A5A] transition hover:text-[#B66A8A]"
                    >
                      <Mail size={13} className="shrink-0 text-[#B66A8A]" />
                      <span className="truncate">{pd.email || profile.email}</span>
                    </a>
                  )}
                  {(pd.phone || profile.phone) && (
                    <a
                      href={`tel:${pd.phone || profile.phone}`}
                      className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-[#6B4A5A] transition hover:text-[#B66A8A]"
                    >
                      <Phone size={13} className="shrink-0 text-[#B66A8A]" />
                      {pd.phone || profile.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          {/* Underline tabs */}
          <div className="border-b border-[#F0DFE7]">
            <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? 'border-[#B66A8A] text-[#B66A8A]'
                        : 'border-transparent text-[#9A5776] hover:border-[#F0DFE7] hover:text-[#5D2B44]'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-5">
            <ProfileDetailsView profile={profile} tab={activeTab} />
          </div>
        </main>
      </div>
    </div>
  );
}
