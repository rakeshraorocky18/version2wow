import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Image } from 'lucide-react';
import api from '../lib/api';
import { getGalleryPhotos, getMainProfilePhoto } from '../lib/profileUtils';
import ProfileMainPhoto from '../components/profile/ProfileMainPhoto';
import ProfileGallerySection, { type GalleryVisibility } from '../components/profile/ProfileGallerySection';

export default function ProfilePhotos() {
  const [searchParams] = useSearchParams();
  const managedMode = searchParams.get('managed') === '1';
  const backPath = managedMode ? '/app/profile/managed' : '/app/profile';

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
        <Link to={backPath} className="mt-4 inline-block text-sm text-[#B66A8A] hover:underline">
          Back to profile
        </Link>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = wizard.personalDetails || profile;
  const displayName = pd.displayName || `${pd.firstName || ''} ${pd.lastName || ''}`.trim() || 'My Profile';
  const mainPhoto = getMainProfilePhoto(profile);
  const galleryPhotos = getGalleryPhotos(profile);
  const galleryVisibility = (profile.galleryVisibility || 'matched_only') as GalleryVisibility;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <Link
        to={backPath}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F0DFE7] bg-white px-4 py-2 text-sm font-medium text-[#B66A8A] shadow-sm transition hover:bg-[#FFF5F8]"
      >
        <ArrowLeft size={16} /> Back to profile
      </Link>

      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0F5] text-[#B66A8A]">
          <Image size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#4A2236]">Photos</h1>
          <p className="text-sm text-[#9A5776]">Manage your profile photo and album for {displayName}</p>
        </div>
      </header>

      <section className="mb-6 overflow-hidden rounded-3xl border border-[#F0DFE7] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-1 font-display text-lg font-semibold text-[#5D2B44]">Profile Photo</h2>
        <p className="mb-6 text-sm text-[#9A5776]">One main photo — visible to everyone on match cards and search.</p>
        <ProfileMainPhoto photoUrl={mainPhoto} displayName={displayName} />
      </section>

      <ProfileGallerySection photos={galleryPhotos} visibility={galleryVisibility} />
    </div>
  );
}
