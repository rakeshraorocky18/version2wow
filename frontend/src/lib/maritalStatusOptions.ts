/** Matrimonial relationship / marital status options (bride & groom profiles). */
export const MARITAL_STATUS_OPTIONS = [
  'Never Married',
  'Divorced',
  'Widowed',
  'Awaiting Divorce',
  'Annulled',
] as const;

export type MaritalStatusOption = (typeof MARITAL_STATUS_OPTIONS)[number];

export const MARITAL_STATUSES_WITH_CHILDREN = ['Divorced', 'Widowed'] as const;

/** @deprecated use MARITAL_STATUSES_WITH_CHILDREN */
export const CHILDREN_MARITAL_STATUSES = MARITAL_STATUSES_WITH_CHILDREN;

export const MAX_PROFILE_PHOTOS = 6;

export function maxGalleryPhotos(hasMainPhoto: boolean): number {
  return hasMainPhoto ? MAX_PROFILE_PHOTOS - 1 : MAX_PROFILE_PHOTOS;
}

export function countProfilePhotos(profile: {
  profilePhoto?: string | null;
  photos?: string[] | null;
}): number {
  const gallery = Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [];
  const galleryOnly = profile.profilePhoto
    ? gallery.filter((p) => p !== profile.profilePhoto)
    : gallery;
  return (profile.profilePhoto ? 1 : 0) + galleryOnly.length;
}
