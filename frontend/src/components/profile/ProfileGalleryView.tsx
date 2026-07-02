import { useState } from 'react';
import { Globe, Heart } from 'lucide-react';
import { getPhotoUrl } from '../../lib/profileUtils';
import ProfilePhotoLocked from './ProfilePhotoLocked';

interface ProfileGalleryViewProps {
  photos: string[];
  locked?: boolean;
  visibility?: 'public' | 'matched_only';
}

export default function ProfileGalleryView({ photos, locked = false, visibility }: ProfileGalleryViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = photos.length ? Math.min(activeIndex, photos.length - 1) : 0;

  if (locked) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#F0DFE7] bg-white shadow-sm">
        <div className="border-b border-[#F0DFE7] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Photo Album</h2>
          <p className="mt-0.5 text-sm text-[#9A5776]">Extra photos beyond the main profile picture</p>
        </div>
        <div className="p-5">
          <ProfilePhotoLocked label="Album unlocks after mutual match" />
        </div>
      </section>
    );
  }

  if (photos.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#F0DFE7] bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-[#F0DFE7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Photo Album</h2>
          <p className="mt-0.5 text-sm text-[#9A5776]">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>
        {visibility && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFF5F8] px-3 py-1 text-xs font-medium text-[#9A5776] ring-1 ring-[#F0DFE7]">
            {visibility === 'public' ? <Globe size={12} className="text-emerald-600" /> : <Heart size={12} className="text-[#B66A8A]" />}
            {visibility === 'public' ? 'Visible to everyone' : 'Matched members only'}
          </span>
        )}
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#FAF0F4] ring-1 ring-[#F0DFE7]">
          <img src={getPhotoUrl(photos[safeIndex])} alt="" className="h-full w-full object-cover" />
        </div>
        {photos.length > 1 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:max-w-[140px]">
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`aspect-square overflow-hidden rounded-lg ring-2 transition ${i === safeIndex ? 'ring-[#B66A8A]' : 'ring-transparent opacity-80 hover:opacity-100'}`}
              >
                <img src={getPhotoUrl(url)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
