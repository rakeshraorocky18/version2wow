import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, ImagePlus, Globe, Heart, Lock, Trash2, Upload } from 'lucide-react';
import api from '../../lib/api';
import { getPhotoUrl } from '../../lib/profileUtils';
import {
  MAX_PROFILE_PHOTOS,
  maxGalleryPhotos,
} from '../../lib/maritalStatusOptions';

export type GalleryVisibility = 'public' | 'matched_only';

interface ProfileGallerySectionProps {
  photos: string[];
  visibility: GalleryVisibility;
  hasMainPhoto?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function ProfileGallerySection({
  photos,
  visibility,
  hasMainPhoto = false,
}: ProfileGallerySectionProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryLimit = maxGalleryPhotos(hasMainPhoto);
  const totalPhotos = (hasMainPhoto ? 1 : 0) + photos.length;

  const safeIndex = photos.length ? Math.min(activeIndex, photos.length - 1) : 0;
  const activePhoto = photos[safeIndex];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['myProfile'] });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      await api.post('/users/profile/gallery', formData);
    },
    onSuccess: () => {
      toast.success('Photo added to album');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Upload failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (url: string) => {
      await api.delete('/users/profile/photos', { data: { url } });
    },
    onSuccess: () => {
      toast.success('Photo removed');
      setActiveIndex(0);
      invalidate();
    },
    onError: () => toast.error('Could not remove photo'),
  });

  const visibilityMutation = useMutation({
    mutationFn: async (v: GalleryVisibility) => {
      await api.put('/users/profile/gallery-visibility', { visibility: v });
    },
    onSuccess: () => {
      toast.success('Album visibility updated');
      invalidate();
    },
    onError: () => toast.error('Could not update visibility'),
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
    if (photos.length >= galleryLimit || totalPhotos >= MAX_PROFILE_PHOTOS) {
      toast.error(
        `You can upload up to ${MAX_PROFILE_PHOTOS} profile photos total. Remove a photo before adding another.`,
      );
      return;
    }
    uploadMutation.mutate(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-[#F0DFE7] bg-white shadow-sm">
      <div className="border-b border-[#F0DFE7] bg-[#FFFBFC] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Photo Album</h2>
            <p className="mt-0.5 text-sm text-[#9A5776]">
              Additional photos · {totalPhotos}/{MAX_PROFILE_PHOTOS} used
              {hasMainPhoto ? ' (includes main profile photo)' : ''}
            </p>
          </div>

          <div className="flex rounded-xl bg-white p-1 ring-1 ring-[#F0DFE7]">
            <button
              type="button"
              onClick={() => visibilityMutation.mutate('public')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                visibility === 'public' ? 'bg-[#FFF5F8] text-[#B66A8A] shadow-sm' : 'text-[#9A5776]'
              }`}
            >
              <Globe size={13} /> Everyone
            </button>
            <button
              type="button"
              onClick={() => visibilityMutation.mutate('matched_only')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                visibility === 'matched_only' ? 'bg-[#FFF5F8] text-[#B66A8A] shadow-sm' : 'text-[#9A5776]'
              }`}
            >
              <Heart size={13} /> Matched only
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending || totalPhotos >= MAX_PROFILE_PHOTOS}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#E5C8D5] bg-[#FFFBFC] py-12 transition hover:border-[#B66A8A] hover:bg-[#FFF5F8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus size={32} className="text-[#B66A8A]" />
            <span className="text-sm font-medium text-[#5D2B44]">Add album photos</span>
            <span className="text-xs text-[#9A5776]">Up to {galleryLimit} more photo{galleryLimit !== 1 ? 's' : ''}</span>
          </button>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#FAF0F4] ring-1 ring-[#F0DFE7]">
              <img src={getPhotoUrl(activePhoto)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => deleteMutation.mutate(activePhoto)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white shadow"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:max-w-[140px] sm:grid-cols-2">
              {photos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`aspect-square overflow-hidden rounded-lg ring-2 ${i === safeIndex ? 'ring-[#B66A8A]' : 'ring-transparent'}`}
                >
                  <img src={getPhotoUrl(url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {photos.length < galleryLimit && totalPhotos < MAX_PROFILE_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#E5C8D5] text-[#B66A8A] hover:bg-[#FFF5F8]"
                >
                  {uploadMutation.isPending ? <Upload size={16} className="animate-pulse" /> : <Camera size={16} />}
                </button>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {totalPhotos >= MAX_PROFILE_PHOTOS && (
          <p className="mt-3 text-xs font-medium text-amber-700">
            Photo limit reached ({MAX_PROFILE_PHOTOS} photos). Remove a photo to upload a new one.
          </p>
        )}

        <p className="mt-4 flex items-center gap-2 border-t border-[#F0DFE7] pt-4 text-xs text-[#9A5776]">
          {visibility === 'public' ? (
            <Globe size={13} className="text-emerald-600" />
          ) : (
            <Lock size={13} className="text-[#B66A8A]" />
          )}
          {visibility === 'public'
            ? 'Album photos are visible to all users on your profile.'
            : 'Album photos are visible only after a mutual match.'}
        </p>
      </div>
    </section>
  );
}
