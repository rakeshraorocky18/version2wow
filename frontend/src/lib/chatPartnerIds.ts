type MatchLike = {
  partnerUserId?: string | null;
  partnerProfile?: { id?: string; userId?: string } | null;
};

export function resolveCanonicalPartnerId(userId: string, matches: MatchLike[]): string {
  for (const m of matches) {
    const ids = [m.partnerUserId, m.partnerProfile?.id, m.partnerProfile?.userId].filter(
      Boolean,
    ) as string[];
    if (ids.includes(userId)) {
      return m.partnerUserId || m.partnerProfile?.userId || userId;
    }
  }
  return userId;
}

export function getPartnerIdAliases(userId: string, matches: MatchLike[]): string[] {
  const canonical = resolveCanonicalPartnerId(userId, matches);
  const aliases = new Set<string>([userId, canonical]);
  for (const m of matches) {
    const ids = [m.partnerUserId, m.partnerProfile?.id, m.partnerProfile?.userId].filter(
      Boolean,
    ) as string[];
    if (ids.some((id) => aliases.has(id))) {
      ids.forEach((id) => aliases.add(id));
    }
  }
  return Array.from(aliases);
}
