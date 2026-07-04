type ProfileLike = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  religion?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  bio?: string;
  photos?: string[];
  profilePhoto?: string;
  wizardProfile?: {
    profilePhoto?: string;
    expressYourself?: { aboutMe?: string };
  };
  expressYourself?: { aboutMe?: string };
  isComplete?: boolean;
};

const COMPLETION_FIELDS: Array<(p: ProfileLike) => boolean> = [
  (p) => Boolean(p.firstName?.trim()),
  (p) => Boolean(p.lastName?.trim()),
  (p) => Boolean(p.gender),
  (p) => Boolean(p.dateOfBirth),
  (p) => Boolean(p.city?.trim()),
  (p) => Boolean(p.religion?.trim()),
  (p) => Boolean(p.education?.trim()),
  (p) => Boolean(p.occupation?.trim()),
  (p) => Boolean(p.maritalStatus?.trim()),
  (p) =>
    Boolean(
      p.bio?.trim() ||
        p.wizardProfile?.expressYourself?.aboutMe?.trim() ||
        p.expressYourself?.aboutMe?.trim(),
    ),
  (p) => collectProfilePhotos(p).length > 0,
];

export function collectProfilePhotos(profile: ProfileLike, max = 6): string[] {
  const urls: string[] = [];
  const main = profile.profilePhoto || profile.wizardProfile?.profilePhoto;
  if (main) urls.push(main);
  profile.photos?.forEach((photo) => {
    if (photo && !urls.includes(photo)) urls.push(photo);
  });
  return urls.slice(0, max);
}

export function estimateProfileCompletion(profile: ProfileLike): number {
  if (profile.isComplete) return 100;
  const filled = COMPLETION_FIELDS.filter((check) => check(profile)).length;
  return Math.min(100, Math.round((filled / COMPLETION_FIELDS.length) * 100));
}

export function formatLastActive(
  onlineStatus?: boolean,
  updatedAt?: string | null,
): string {
  if (onlineStatus) return 'Active now';
  if (!updatedAt) return 'Recently active';

  const diffMs = Date.now() - new Date(updatedAt).getTime();
  if (diffMs < 0 || Number.isNaN(diffMs)) return 'Recently active';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Active ${weeks}w ago`;

  return 'Active recently';
}
