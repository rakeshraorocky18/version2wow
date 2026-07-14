import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  Neo4jInterestRecord,
  Neo4jShortlistRecord,
  Neo4jUserNodeProps,
} from './neo4j.constants';
import { Neo4jRepository } from './neo4j.repository';

/**
 * Application-facing Neo4j API for matchmaking.
 * Wraps the repository with validation, logging, and safe no-ops when Neo4j is offline.
 */
@Injectable()
export class Neo4jService {
  private readonly logger = new Logger(Neo4jService.name);

  constructor(private readonly repository: Neo4jRepository) {}

  isEnabled(): boolean {
    return this.repository.isReady();
  }

  private async safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    if (!this.isEnabled()) return fallback;
    try {
      return await fn();
    } catch (error) {
      this.logger.warn(
        `Neo4j ${label} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return fallback;
    }
  }

  private async require<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Neo4j graph database is not configured');
    }
    try {
      return await fn();
    } catch (error) {
      this.logger.error(
        `Neo4j ${label} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ─── User nodes ───────────────────────────────────────────────────────────

  async upsertUserNode(props: Neo4jUserNodeProps): Promise<void> {
    await this.safe('upsertUserNode', () => this.repository.upsertUserNode(props), undefined);
  }

  async syncUserFromProfile(profile: {
    userId: string;
    gender?: string | null;
    isComplete?: boolean;
    profileCompleted?: boolean;
  }): Promise<void> {
    await this.upsertUserNode({
      id: profile.userId,
      gender: profile.gender ?? null,
      profileCompleted: Boolean(profile.isComplete ?? profile.profileCompleted),
    });
  }

  // ─── Shortlist ────────────────────────────────────────────────────────────

  async shortlistUser(
    fromUserId: string,
    toUserId: string,
    profileId?: string,
  ): Promise<Neo4jShortlistRecord | null> {
    return this.require('shortlistUser', () =>
      this.repository.createShortlist(fromUserId, toUserId, profileId),
    );
  }

  async removeShortlist(fromUserId: string, toUserId: string): Promise<boolean> {
    return this.require('removeShortlist', () =>
      this.repository.deleteShortlist(fromUserId, toUserId),
    );
  }

  async getShortlistedUserIds(userId: string): Promise<string[]> {
    return this.safe('getShortlistedUserIds', () => this.repository.getShortlistedUserIds(userId), []);
  }

  async getShortlistRecords(userId: string): Promise<Neo4jShortlistRecord[]> {
    return this.safe('getShortlistRecords', () => this.repository.getShortlistRecords(userId), []);
  }

  // ─── Interest / Match ─────────────────────────────────────────────────────

  async sendInterest(params: {
    matchId: string;
    senderId: string;
    receiverId: string;
    message?: string | null;
    compatibilityScore?: number | null;
  }): Promise<Neo4jInterestRecord | null> {
    return this.require('sendInterest', () => this.repository.createInterestSent(params));
  }

  async acceptInterest(matchId: string, receiverId: string): Promise<Neo4jInterestRecord | null> {
    return this.require('acceptInterest', () =>
      this.repository.acceptInterest(matchId, receiverId),
    );
  }

  async rejectInterest(matchId: string, receiverId: string): Promise<Neo4jInterestRecord | null> {
    return this.require('rejectInterest', () =>
      this.repository.rejectInterest(matchId, receiverId),
    );
  }

  async findInterestByMatchId(matchId: string): Promise<Neo4jInterestRecord | null> {
    return this.safe(
      'findInterestByMatchId',
      () => this.repository.findInterestByMatchId(matchId),
      null,
    );
  }

  async hasExistingInterestOrMatch(userA: string, userB: string): Promise<boolean> {
    return this.safe(
      'hasExistingInterestOrMatch',
      () => this.repository.hasAnyRelationship(userA, userB),
      false,
    );
  }

  async getReceivedInterests(userId: string): Promise<Neo4jInterestRecord[]> {
    return this.safe('getReceivedInterests', () => this.repository.getReceivedInterests(userId), []);
  }

  async getSentInterests(userId: string): Promise<Neo4jInterestRecord[]> {
    return this.safe('getSentInterests', () => this.repository.getSentInterests(userId), []);
  }

  async getMatchedPairs(userId: string): Promise<Neo4jInterestRecord[]> {
    return this.safe('getMatchedPairs', () => this.repository.getMatchedPairs(userId), []);
  }

  async isMatched(userA: string, userB: string): Promise<boolean> {
    return this.safe('isMatched', () => this.repository.isMatched(userA, userB), false);
  }

  // ─── Block / Ignore / View ────────────────────────────────────────────────

  async blockUser(fromUserId: string, toUserId: string, matchId?: string): Promise<void> {
    await this.require('blockUser', () =>
      this.repository.createBlocked(fromUserId, toUserId, matchId),
    );
  }

  async unblockUser(fromUserId: string, toUserId: string): Promise<boolean> {
    return this.require('unblockUser', () => this.repository.deleteBlocked(fromUserId, toUserId));
  }

  async restoreMatch(userA: string, userB: string, matchId?: string): Promise<void> {
    await this.require('restoreMatch', () =>
      this.repository.restoreMatchedAfterUnblock(userA, userB, matchId),
    );
  }

  async isBlocked(userA: string, userB: string): Promise<boolean> {
    return this.safe('isBlocked', () => this.repository.isBlockedEitherWay(userA, userB), false);
  }

  async ignoreUser(fromUserId: string, toUserId: string): Promise<void> {
    await this.require('ignoreUser', () => this.repository.createIgnored(fromUserId, toUserId));
  }

  async recordProfileView(fromUserId: string, toUserId: string): Promise<void> {
    await this.safe(
      'recordProfileView',
      () => this.repository.createViewed(fromUserId, toUserId),
      undefined,
    );
  }

  // ─── Recommendations ──────────────────────────────────────────────────────

  /** Excluded user IDs for discovery (blocked, ignored, matched, interest). */
  async getExcludedUserIds(userId: string): Promise<string[]> {
    return this.safe('getExcludedUserIds', () => this.repository.getExcludedUserIds(userId), []);
  }

  /** Recommendation candidate user IDs only — fetch profiles from MongoDB. */
  async getRecommendationUserIds(userId: string, limit = 40): Promise<string[]> {
    return this.safe(
      'getRecommendationUserIds',
      () => this.repository.getRecommendationUserIds(userId, limit),
      [],
    );
  }

  async getGraphBoostUserIds(userId: string, limit = 20): Promise<string[]> {
    return this.safe(
      'getGraphBoostUserIds',
      () => this.repository.getGraphBoostUserIds(userId, limit),
      [],
    );
  }

  async getRelationshipSummaries(userId: string) {
    return this.safe(
      'getRelationshipSummaries',
      () => this.repository.getRelationshipSummaries(userId),
      [],
    );
  }
}
