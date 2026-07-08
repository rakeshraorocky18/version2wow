import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  UserCircle,
  GraduationCap,
  Briefcase,
  Users,
  HeartHandshake,
} from 'lucide-react';
import api from '../lib/api';
import { getMainProfilePhoto, getPhotoUrl } from '../lib/profileUtils';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';

const TABS: { id: ProfileTab; label: string; icon: typeof UserCircle }[] = [
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Work', icon: Briefcase },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake },
];

export default function ProfileDetails() {
  const [searchParams] = useSearchParams();
  const managedMode = searchParams.get('managed') === '1';
  const backPath = managedMode ? '/app/profile/managed' : '/app/profile';
  const editPath = managedMode ? '/app/profile/edit/managed' : '/app/profile/edit';
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F4E4EC] border-t-[#B66A8A]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-[#815A6D]">No profile found.</p>
        <Link to={editPath} className="mt-4 inline-block text-sm text-[#B66A8A] hover:underline">
          Create profile
        </Link>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = wizard.personalDetails || profile;
  const displayName =
    pd.displayName ||
    `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim() ||
    'My Profile';
  const photoUrl = getPhotoUrl(getMainProfilePhoto(profile));

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 rounded-full border border-[#F0DFE7] bg-white px-4 py-2 text-sm font-medium text-[#B66A8A] shadow-sm transition hover:bg-[#FFF5F8]"
        >
          <ArrowLeft size={16} /> Back to profile
        </Link>
        <Link
          to={editPath}
          className="inline-flex items-center gap-2 rounded-xl bg-[#B66A8A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#A75878]"
        >
          <Pencil size={15} /> Edit profile
        </Link>
      </div>

      <header className="mb-6 flex items-center gap-4 rounded-2xl border border-[#F0DFE7] bg-white p-5 shadow-sm">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#F7ECFF] ring-2 ring-[#F4D8E4]">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#4A2236]">{displayName}</h1>
          <p className="text-sm text-[#9A5776]">Full profile — read only</p>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-[#F0DFE7] bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-[#F0DFE7] bg-[#FFFBFC] px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition ${
                activeTab === id
                  ? 'border-[#B66A8A] text-[#B66A8A]'
                  : 'border-transparent text-[#9A5776] hover:text-[#5D2B44]'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-5 sm:p-6">
          <ProfileDetailsView profile={profile} tab={activeTab} visibility="full" />
        </div>
      </div>
    </div>
  );
}
