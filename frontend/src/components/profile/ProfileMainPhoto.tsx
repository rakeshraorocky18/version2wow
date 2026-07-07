import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, User } from 'lucide-react';
import api from '../../lib/api';
import { getPhotoUrl } from '../../lib/profileUtils';
import { MAX_PROFILE_PHOTOS } from '../../lib/maritalStatusOptions';

interface ProfileMainPhotoProps {
  photoUrl: string;
  displayName: string;
  totalPhotoCount?: number;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function ProfileMainPhoto({
  photoUrl,
  displayName,
  totalPhotoCount = 0,
}: ProfileMainPhotoProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      await api.post('/users/profile/photo', formData);
    },
    onSuccess: () => {
      toast.success('Profile photo updated');
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Upload failed');
    },
  });

  const handleFile = (file: File | null) => {
    if (!file?.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, or WEBP)');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }
    if (!photoUrl && totalPhotoCount >= MAX_PROFILE_PHOTOS) {
      toast.error(
        `You can upload up to ${MAX_PROFILE_PHOTOS} profile photos total. Remove a photo before adding another.`,
      );
      return;
    }
    upload.mutate(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="relative mx-auto w-fit">
      <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#F7ECFF] shadow-lg ring-2 ring-[#F4D8E4] sm:h-36 sm:w-36">
        {photoUrl ? (
          <img src={getPhotoUrl(photoUrl)} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User size={48} className="text-[#C4899F]" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={upload.isPending}
        className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#B66A8A] text-white shadow-lg transition hover:bg-[#A75878] disabled:opacity-60"
        aria-label="Change profile photo"
      >
        <Camera size={18} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      <p className="mt-2 text-center text-[11px] font-medium text-emerald-700">
        Main photo · {totalPhotoCount}/{MAX_PROFILE_PHOTOS} photos used
      </p>
    </div>
  );
}
