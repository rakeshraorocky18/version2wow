/** Neo4j dependency-injection tokens and relationship type constants. */

export const NEO4J_DRIVER = 'NEO4J_DRIVER';

/** Node label for matrimonial users in the graph. */
export const NEO4J_USER_LABEL = 'User';

/**
 * Relationship types stored in Neo4j.
 * Neo4j holds ONLY relationships (+ minimal User node props). Profiles stay in MongoDB.
 */
export enum Neo4jRelationType {
  SHORTLISTED = 'SHORTLISTED',
  INTEREST_SENT = 'INTEREST_SENT',
  MATCHED = 'MATCHED',
  BLOCKED = 'BLOCKED',
  VIEWED = 'VIEWED',
  IGNORED = 'IGNORED',
}

export type Neo4jUserNodeProps = {
  id: string;
  gender?: string | null;
  profileCompleted?: boolean;
};

export type Neo4jInterestRecord = {
  matchId: string;
  senderId: string;
  receiverId: string;
  message?: string | null;
  compatibilityScore?: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Neo4jShortlistRecord = {
  userId: string;
  targetUserId: string;
  profileId?: string | null;
  createdAt?: string | null;
};
