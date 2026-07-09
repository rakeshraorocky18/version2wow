import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  MapPin,
  Calendar,
  BookOpen,
  ChevronRight,
  Image,
  AlertCircle,
  UserRound,
  Eye,
  Pencil,
} from 'lucide-react';
import api from '../lib/api';
import {
  apiProfileToForm,
  getMissingBySection,
  profileCompletion,
} from '../lib/profileEditValidation';
import { getMainProfilePhoto, getPhotoUrl, getProfilePhotos } from '../lib/profileUtils';
import { MAX_PROFILE_PHOTOS } from '../lib/maritalStatusOptions';

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

export default function Profile({ managedMode = false }: { managedMode?: boolean }) {
  const editPath = managedMode ? '/app/profile/edit/managed' : '/app/profile/edit';
  const viewPath = managedMode ? '/app/profile/details?managed=1' : '/app/profile/details';
  const photosPath = managedMode ? '/app/profile/photos?managed=1' : '/app/profile/photos';
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F4E4EC] border-t-[#B66A8A]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <User size={48} className="mx-auto text-[#D4A8BC]" />
        <h1 className="mt-4 font-display text-xl font-bold text-[#5D2B44]">Create your profile</h1>
        <Link
          to={editPath}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B66A8A] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Get started
        </Link>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = wizard.personalDetails || profile;
  const religion = wizard.religion || profile;
  const mainPhoto = getMainProfilePhoto(profile);
  const allPhotos = getProfilePhotos(profile);
  const photoUrl = getPhotoUrl(mainPhoto);
  const fullName = `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim();
  const displayName = pd.displayName || fullName || 'My Profile';
  const location = [pd.city || profile.city, pd.state || profile.state].filter(Boolean).join(', ');
  const age = getAge(pd.dateOfBirth || profile.dateOfBirth);
  const religionLabel = religion.religion || profile.religion;
  const maritalStatus = profile.maritalStatus;

  const formSnapshot = apiProfileToForm(profile);
  const completion = profileCompletion(formSnapshot);
  const missingSections = getMissingBySection(formSnapshot);
  const missingFieldCount = missingSections.reduce((n, s) => n + s.fields.length, 0);

  return (
    <div className="mx-auto max-w-2xl pb-16">
      {managedMode && (
        <Link to={hubPath} className="mb-4 inline-flex items-center gap-2 text-sm text-[#B66A8A] hover:underline">
          ← Back to hub
        </Link>
      )}

      {/* Main profile summary */}
      <section className="overflow-hidden rounded-3xl border border-[#F0DFE7] bg-white shadow-[0_8px_32px_rgba(182,106,138,0.08)]">
        <div className="bg-gradient-to-r from-[#FCE8EF] via-[#F6E8FF] to-[#FFF5EF] px-6 py-8 text-center">
          <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[#F7ECFF] shadow-lg ring-2 ring-[#F4D8E4]">
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound size={48} className="text-[#C4899F]" />
              </div>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-[#4A2236]">{displayName}</h1>
          {location && (
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-[#7B4A62]">
              <MapPin size={14} className="text-[#B66A8A]" /> {location}
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#B66A8A] shadow-sm backdrop-blur-sm">
            {completion}% profile complete
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#F0DFE7] border-t border-[#F0DFE7]">
          {age != null && (
            <div className="px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#B0889A]">
                <Calendar size={11} /> Age
              </p>
              <p className="mt-1 text-sm font-semibold text-[#5D2B44]">{age} yrs</p>
            </div>
          )}
          {pd.gender && (
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B0889A]">Gender</p>
              <p className="mt-1 text-sm font-semibold capitalize text-[#5D2B44]">{pd.gender}</p>
            </div>
          )}
          {religionLabel && (
            <div className="px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#B0889A]">
                <BookOpen size={11} /> Religion
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[#5D2B44]">{religionLabel}</p>
            </div>
          )}
          {maritalStatus && (
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B0889A]">Marital</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#5D2B44]">{maritalStatus}</p>
            </div>
          )}
        </div>
      </section>

      {missingFieldCount > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {missingFieldCount} required field{missingFieldCount !== 1 ? 's' : ''} missing
            </p>
            <p className="mt-0.5 text-xs text-amber-800">Use Edit profile to complete your information.</p>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div className="mt-6 space-y-3">
        <Link
          to={viewPath}
          className="group flex items-center gap-4 rounded-2xl border border-[#F0DFE7] bg-white p-5 shadow-sm transition hover:border-[#E5C8D5] hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F5] text-[#B66A8A] transition group-hover:bg-[#B66A8A] group-hover:text-white">
            <Eye size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-[#4A2236]">View Profile</p>
            <p className="mt-0.5 text-sm text-[#9A5776]">See all your details — personal, education, work & more</p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-[#C4A0B0] transition group-hover:text-[#B66A8A]" />
        </Link>

        <Link
          to={editPath}
          className="group flex items-center gap-4 rounded-2xl border border-[#F0DFE7] bg-white p-5 shadow-sm transition hover:border-[#E5C8D5] hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#9B8FD4] transition group-hover:bg-[#9B8FD4] group-hover:text-white">
            <Pencil size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-[#4A2236]">Edit Profile</p>
            <p className="mt-0.5 text-sm text-[#9A5776]">
              {missingFieldCount > 0
                ? `${missingFieldCount} field${missingFieldCount !== 1 ? 's' : ''} need attention`
                : 'Update your information section by section'}
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-[#C4A0B0] transition group-hover:text-[#B66A8A]" />
        </Link>

        <Link
          to={photosPath}
          className="group flex items-center gap-4 rounded-2xl border border-[#F0DFE7] bg-white p-5 shadow-sm transition hover:border-[#E5C8D5] hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F8EF] text-[#3D8B5F] transition group-hover:bg-[#3D8B5F] group-hover:text-white">
            <Image size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-[#4A2236]">Photos</p>
            <p className="mt-0.5 text-sm text-[#9A5776]">
              {allPhotos.length > 0
                ? `${allPhotos.length} of ${MAX_PROFILE_PHOTOS} profile photos`
                : `Add up to ${MAX_PROFILE_PHOTOS} profile photos`}
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-[#C4A0B0] transition group-hover:text-[#B66A8A]" />
        </Link>
      </div>
    </div>
  );
}
