export function resolveViewerGender(
  profileGender?: string | null,
  userRole?: string | null,
): 'male' | 'female' | null {
  if (profileGender === 'male' || profileGender === 'female') return profileGender;
  if (userRole === 'groom') return 'male';
  if (userRole === 'bride') return 'female';
  return null;
}

export function resolveOppositeGenderLabel(
  profileGender?: string | null,
  userRole?: string | null,
): string | null {
  const gender = resolveViewerGender(profileGender, userRole);
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  return null;
}

export function formatMatchGenderLabel(gender: string | null): string | null {
  if (gender === 'female') return 'Female profiles';
  if (gender === 'male') return 'Male profiles';
  return null;
}
