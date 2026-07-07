import type { MatchInterest } from '../types/matchmaking';

export type InterestStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'rejected';

export interface InterestRelationship {
  interestStatus: InterestStatus;
  matchId?: string | null;
  partnerUserId?: string | null;
}

type ProfileRef = {
  id?: string;
  userId?: string;
  interestStatus?: InterestStatus | string;
  matchPartnerUserId?: string | null;
};

function addProfileRefIds(set: Set<string>, profile?: ProfileRef | null) {
  if (!profile) return;
  if (profile.id) set.add(profile.id);
  if (profile.userId) set.add(profile.userId);
}

function profileKeys(profile: ProfileRef): Set<string> {
  const keys = new Set<string>();
  if (profile.id) keys.add(profile.id);
  if (profile.userId) keys.add(profile.userId);
  return keys;
}

function matchesProfile(profile: ProfileRef, match: MatchInterest, currentUserId?: string): boolean {
  const keys = profileKeys(profile);
  if (match.partnerUserId && keys.has(match.partnerUserId)) return true;
  if (match.receiverProfile && keys.has(match.receiverProfile.id)) return true;
  if (match.receiverProfile?.userId && keys.has(match.receiverProfile.userId)) return true;
  if (match.senderProfile && keys.has(match.senderProfile.id)) return true;
  if (match.senderProfile?.userId && keys.has(match.senderProfile.userId)) return true;
  if (match.receiverId && keys.has(match.receiverId)) return true;
  if (match.senderId && keys.has(match.senderId)) return true;
  if (currentUserId && match.senderId === currentUserId && match.receiverProfile) {
    return keys.has(match.receiverProfile.id) || keys.has(match.receiverProfile.userId);
  }
  if (currentUserId && match.receiverId === currentUserId && match.senderProfile) {
    return keys.has(match.senderProfile.id) || keys.has(match.senderProfile.userId);
  }
  return false;
}

const STATUS_PRIORITY: Record<InterestStatus, number> = {
  accepted: 5,
  pending_sent: 4,
  pending_received: 4,
  rejected: 2,
  none: 0,
};

function pickHigherStatus(a: InterestStatus, b: InterestStatus): InterestStatus {
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

/** Resolve interest status from API field or client-side match lists. */
export function resolveInterestStatus(
  profile: ProfileRef,
  sent?: MatchInterest[],
  received?: MatchInterest[],
  accepted?: MatchInterest[],
  currentUserId?: string,
  extraIds?: Set<string>,
): InterestStatus {
  const apiStatus = profile.interestStatus as InterestStatus | undefined;
  if (apiStatus && apiStatus !== 'none') return apiStatus;

  let status: InterestStatus = 'none';

  accepted?.forEach((match) => {
    if (matchesProfile(profile, match, currentUserId)) {
      status = pickHigherStatus(status, 'accepted');
    }
  });

  received?.forEach((match) => {
    if (match.status === 'pending' && matchesProfile(profile, match, currentUserId)) {
      status = pickHigherStatus(status, 'pending_received');
    }
  });

  sent?.forEach((match) => {
    if (match.status === 'rejected' || match.status === 'blocked') {
      if (matchesProfile(profile, match, currentUserId)) {
        status = pickHigherStatus(status, 'rejected');
      }
      return;
    }
    if (match.status === 'accepted' && matchesProfile(profile, match, currentUserId)) {
      status = pickHigherStatus(status, 'accepted');
      return;
    }
    if (match.status === 'pending' && matchesProfile(profile, match, currentUserId)) {
      status = pickHigherStatus(status, 'pending_sent');
    }
  });

  if (extraIds) {
    const keys = profileKeys(profile);
    const hit = [...keys].some((k) => extraIds.has(k));
    if (hit && status === 'none') status = 'pending_sent';
  }

  return status;
}

export function resolvePartnerUserId(
  profile: ProfileRef,
  accepted?: MatchInterest[],
  sent?: MatchInterest[],
  currentUserId?: string,
): string | undefined {
  if (profile.matchPartnerUserId) return profile.matchPartnerUserId;
  const match =
    accepted?.find((m) => matchesProfile(profile, m, currentUserId)) ||
    sent?.find((m) => matchesProfile(profile, m, currentUserId));
  return match?.partnerUserId || match?.receiverProfile?.userId || profile.userId;
}

/** Show "Interested in …? / Connect Now" only when no relationship exists yet. */
export function shouldShowInterestPrompt(status: InterestStatus): boolean {
  return status === 'none';
}

export function isInterestAlreadyExistsError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('interest already exists') || lower.includes('already exists between');
}

/** @deprecated use resolveInterestStatus */
export type ConnectionState = 'none' | 'sent' | 'connected';

/** @deprecated use resolveInterestStatus */
export function getConnectionState(
  profile: ProfileRef,
  sent: MatchInterest[] | undefined,
  accepted: MatchInterest[] | undefined,
  currentUserId?: string,
  extraIds?: Set<string>,
): ConnectionState {
  const status = resolveInterestStatus(profile, sent, undefined, accepted, currentUserId, extraIds);
  if (status === 'accepted') return 'connected';
  if (status === 'pending_sent' || status === 'pending_received') return 'sent';
  return 'none';
}

export function getSentProfileIds(sent: MatchInterest[] | undefined, currentUserId?: string): Set<string> {
  const ids = new Set<string>();
  sent?.forEach((match) => {
    if (match.status === 'rejected' || match.status === 'blocked') return;
    addProfileRefIds(ids, match.receiverProfile);
    if (match.receiverId) ids.add(match.receiverId);
    if (match.partnerUserId) ids.add(match.partnerUserId);
    void currentUserId;
  });
  return ids;
}

export function getAcceptedProfileIds(
  accepted: MatchInterest[] | undefined,
  currentUserId?: string,
): Set<string> {
  const ids = new Set<string>();
  accepted?.forEach((match) => {
    addProfileRefIds(ids, match.partnerProfile);
    addProfileRefIds(ids, match.receiverProfile);
    addProfileRefIds(ids, match.senderProfile);
    if (match.partnerUserId) ids.add(match.partnerUserId);
    void currentUserId;
  });
  return ids;
}
