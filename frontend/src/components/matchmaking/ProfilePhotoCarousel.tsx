import React from 'react';

interface Props {
  photos?: string[];
  alt?: string;
  gender?: string;
}

export default function ProfilePhotoCarousel({ photos = [], alt = 'Profile photo' }: Props) {
  const photo = photos[0];
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
      {photo ? (
        <img src={photo} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm text-gray-500">No photo</span>
      )}
    </div>
  );
}
