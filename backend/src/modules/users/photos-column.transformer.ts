function cleanPhotoList(value: unknown): string[] | null {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    const cleaned = value.filter(
      (p): p is string => typeof p === 'string' && p.length > 0 && !p.startsWith('data:'),
    );
    return cleaned.length ? cleaned : null;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('[')) {
    try {
      return cleanPhotoList(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('http')) return [trimmed];

  return null;
}

export const photosColumnTransformer = {
  to: (value: string[] | null | undefined): string | null => {
    const cleaned = cleanPhotoList(value);
    return cleaned?.length ? JSON.stringify(cleaned) : null;
  },
  from: (value: string | null | undefined): string[] | null => cleanPhotoList(value),
};
