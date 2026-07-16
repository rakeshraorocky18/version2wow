/** Shared helpers for customer avatar display */

export function getCustomerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Resolve a stored upload path to a browser-usable URL.
 * Relative `/uploads/...` paths work with the Vite proxy in development.
 */
export function resolveCustomerImageUrl(
  path?: string | null,
): string | undefined {
  if (!path) return undefined;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiUrl || apiUrl.startsWith('/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  const origin = apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getCustomerProfileImageUrl(customer: {
  profileImageUrl?: string | null;
  documents?: { type: string; fileUrl: string; createdAt?: string }[];
}): string | undefined {
  if (customer.profileImageUrl) {
    return resolveCustomerImageUrl(customer.profileImageUrl);
  }

  const docs = customer.documents || [];
  const profileDocs = docs
    .filter((d) => d.type === 'profile_photo')
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
  if (profileDocs[0]?.fileUrl) {
    return resolveCustomerImageUrl(profileDocs[0].fileUrl);
  }

  const galleryDocs = docs
    .filter((d) => d.type === 'customer_photo')
    .sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return at - bt;
    });
  if (galleryDocs[0]?.fileUrl) {
    return resolveCustomerImageUrl(galleryDocs[0].fileUrl);
  }

  return undefined;
}
