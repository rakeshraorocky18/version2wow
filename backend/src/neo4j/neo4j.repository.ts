import { Injectable, Logger, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { Driver, Session, ManagedTransaction, Record as Neo4jRecord } from 'neo4j-driver';
import {
  NEO4J_DRIVER,
  Neo4jInterestRecord,
  Neo4jRelationType,
  Neo4jShortlistRecord,
  Neo4jUserNodeProps,
} from './neo4j.constants';

/**
 * All Cypher queries for matchmaking graph operations live here.
 * Controllers/services must never embed Cypher directly.
 */
@Injectable()
export class Neo4jRepository implements OnModuleDestroy {
  private readonly logger = new Logger(Neo4jRepository.name);

  constructor(
    @Optional()
    @Inject(NEO4J_DRIVER)
    private readonly driver: Driver | null,
  ) {}

  isReady(): boolean {
    return Boolean(this.driver);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.logger.log('Neo4j driver closed');
    }
  }

  private getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver is not configured');
    }
    return this.driver.session();
  }

  /**
   * Run a read/write query with automatic session close.
   */
  async run<T = unknown>(
    cypher: string,
    params: Record<string, unknown> = {},
    write = true,
  ): Promise<T[]> {
    if (!this.driver) return [];

    const session = this.getSession();
    try {
      const result = write
        ? await session.executeWrite((tx: ManagedTransaction) => tx.run(cypher, params))
        : await session.executeRead((tx: ManagedTransaction) => tx.run(cypher, params));
      return result.records.map((record: Neo4jRecord) => record.toObject() as T);
    } catch (error) {
      this.logger.error(
        `Neo4j query failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Run multiple statements inside a single write transaction.
   */
  async runInTransaction(
    work: (tx: ManagedTransaction) => Promise<void>,
  ): Promise<void> {
    if (!this.driver) return;
    const session = this.getSession();
    try {
      await session.executeWrite(async (tx: ManagedTransaction) => {
        await work(tx);
      });
    } finally {
      await session.close();
    }
  }

  // ─── User nodes ───────────────────────────────────────────────────────────

  /** MERGE User node — stores ONLY id, gender, profileCompleted. */
  async upsertUserNode(props: Neo4jUserNodeProps): Promise<void> {
    await this.run(
      `
      MERGE (u:User {id: $id})
      SET u.gender = coalesce($gender, u.gender),
          u.profileCompleted = coalesce($profileCompleted, u.profileCompleted, false),
          u.updatedAt = datetime()
      ON CREATE SET u.createdAt = datetime(),
                    u.profileCompleted = coalesce($profileCompleted, false)
      `,
      {
        id: props.id,
        gender: props.gender ?? null,
        profileCompleted: props.profileCompleted ?? null,
      },
    );
  }

  async ensureUserNodes(users: Neo4jUserNodeProps[]): Promise<void> {
    for (const user of users) {
      await this.upsertUserNode(user);
    }
  }

  // ─── Shortlist ────────────────────────────────────────────────────────────

  async createShortlist(
    fromUserId: string,
    toUserId: string,
    profileId?: string,
  ): Promise<Neo4jShortlistRecord | null> {
    const rows = await this.run<{
      userId: string;
      targetUserId: string;
      profileId: string | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MERGE (a:User {id: $fromUserId})
      MERGE (b:User {id: $toUserId})
      MERGE (a)-[r:SHORTLISTED]->(b)
      ON CREATE SET r.createdAt = datetime(), r.profileId = $profileId
      SET r.profileId = coalesce($profileId, r.profileId)
      RETURN a.id AS userId, b.id AS targetUserId, r.profileId AS profileId, r.createdAt AS createdAt
      `,
      { fromUserId, toUserId, profileId: profileId ?? null },
    );
    const row = rows[0];
    if (!row) return null;
    return {
      userId: row.userId,
      targetUserId: row.targetUserId,
      profileId: row.profileId,
      createdAt: row.createdAt ? String(row.createdAt) : null,
    };
  }

  async deleteShortlist(fromUserId: string, toUserId: string): Promise<boolean> {
    const rows = await this.run<{ deleted: number }>(
      `
      MATCH (a:User {id: $fromUserId})-[r:SHORTLISTED]->(b:User {id: $toUserId})
      DELETE r
      RETURN count(*) AS deleted
      `,
      { fromUserId, toUserId },
    );
    return (rows[0]?.deleted ?? 0) > 0;
  }

  async getShortlistedUserIds(userId: string): Promise<string[]> {
    const rows = await this.run<{ targetUserId: string }>(
      `
      MATCH (a:User {id: $userId})-[:SHORTLISTED]->(b:User)
      RETURN b.id AS targetUserId
      ORDER BY b.id
      `,
      { userId },
      false,
    );
    return rows.map((r) => r.targetUserId);
  }

  async getShortlistRecords(userId: string): Promise<Neo4jShortlistRecord[]> {
    const rows = await this.run<{
      userId: string;
      targetUserId: string;
      profileId: string | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User {id: $userId})-[r:SHORTLISTED]->(b:User)
      RETURN a.id AS userId, b.id AS targetUserId, r.profileId AS profileId, r.createdAt AS createdAt
      ORDER BY r.createdAt DESC
      `,
      { userId },
      false,
    );
    return rows.map((r) => ({
      userId: r.userId,
      targetUserId: r.targetUserId,
      profileId: r.profileId,
      createdAt: r.createdAt ? String(r.createdAt) : null,
    }));
  }

  // ─── Interest / Match ─────────────────────────────────────────────────────

  async createInterestSent(params: {
    matchId: string;
    senderId: string;
    receiverId: string;
    message?: string | null;
    compatibilityScore?: number | null;
  }): Promise<Neo4jInterestRecord | null> {
    const rows = await this.run<{
      matchId: string;
      senderId: string;
      receiverId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MERGE (a:User {id: $senderId})
      MERGE (b:User {id: $receiverId})
      MERGE (a)-[r:INTEREST_SENT {matchId: $matchId}]->(b)
      ON CREATE SET
        r.createdAt = datetime(),
        r.message = $message,
        r.compatibilityScore = $compatibilityScore
      RETURN r.matchId AS matchId,
             a.id AS senderId,
             b.id AS receiverId,
             r.message AS message,
             r.compatibilityScore AS compatibilityScore,
             r.createdAt AS createdAt
      `,
      {
        matchId: params.matchId,
        senderId: params.senderId,
        receiverId: params.receiverId,
        message: params.message ?? null,
        compatibilityScore: params.compatibilityScore ?? null,
      },
    );
    const row = rows[0];
    if (!row) return null;
    return {
      matchId: row.matchId,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      compatibilityScore: row.compatibilityScore,
      status: 'pending',
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: row.createdAt ? String(row.createdAt) : null,
    };
  }

  async acceptInterest(matchId: string, receiverId: string): Promise<Neo4jInterestRecord | null> {
    let accepted: Neo4jInterestRecord | null = null;

    await this.runInTransaction(async (tx) => {
      const find = await tx.run(
        `
        MATCH (a:User)-[r:INTEREST_SENT {matchId: $matchId}]->(b:User {id: $receiverId})
        RETURN a.id AS senderId, b.id AS receiverId,
               r.matchId AS matchId, r.message AS message,
               r.compatibilityScore AS compatibilityScore,
               r.createdAt AS createdAt
        `,
        { matchId, receiverId },
      );
      if (!find.records.length) return;

      const rec = find.records[0].toObject() as {
        senderId: string;
        receiverId: string;
        matchId: string;
        message: string | null;
        compatibilityScore: number | null;
        createdAt: { toString(): string } | string | null;
      };

      await tx.run(
        `
        MATCH (a:User {id: $senderId})-[r:INTEREST_SENT {matchId: $matchId}]->(b:User {id: $receiverId})
        DELETE r
        `,
        { senderId: rec.senderId, receiverId: rec.receiverId, matchId },
      );

      await tx.run(
        `
        MATCH (a:User {id: $senderId}), (b:User {id: $receiverId})
        MERGE (a)-[m:MATCHED]->(b)
        MERGE (b)-[m2:MATCHED]->(a)
        SET m.matchId = $matchId,
            m.message = $message,
            m.compatibilityScore = $compatibilityScore,
            m.createdAt = coalesce(m.createdAt, datetime()),
            m.updatedAt = datetime(),
            m2.matchId = $matchId,
            m2.message = $message,
            m2.compatibilityScore = $compatibilityScore,
            m2.createdAt = coalesce(m2.createdAt, datetime()),
            m2.updatedAt = datetime()
        `,
        {
          senderId: rec.senderId,
          receiverId: rec.receiverId,
          matchId,
          message: rec.message,
          compatibilityScore: rec.compatibilityScore,
        },
      );

      accepted = {
        matchId: rec.matchId,
        senderId: rec.senderId,
        receiverId: rec.receiverId,
        message: rec.message,
        compatibilityScore: rec.compatibilityScore,
        status: 'accepted',
        createdAt: rec.createdAt ? String(rec.createdAt) : null,
        updatedAt: new Date().toISOString(),
      };
    });

    return accepted;
  }

  async rejectInterest(matchId: string, receiverId: string): Promise<Neo4jInterestRecord | null> {
    const rows = await this.run<{
      matchId: string;
      senderId: string;
      receiverId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User)-[r:INTEREST_SENT {matchId: $matchId}]->(b:User {id: $receiverId})
      WITH a, b, r, r.message AS message, r.compatibilityScore AS compatibilityScore, r.createdAt AS createdAt
      DELETE r
      RETURN $matchId AS matchId, a.id AS senderId, b.id AS receiverId,
             message, compatibilityScore, createdAt
      `,
      { matchId, receiverId },
    );
    const row = rows[0];
    if (!row) return null;
    return {
      matchId: row.matchId,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      compatibilityScore: row.compatibilityScore,
      status: 'rejected',
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: new Date().toISOString(),
    };
  }

  async findInterestByMatchId(matchId: string): Promise<Neo4jInterestRecord | null> {
    const pending = await this.run<{
      matchId: string;
      senderId: string;
      receiverId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User)-[r:INTEREST_SENT {matchId: $matchId}]->(b:User)
      RETURN r.matchId AS matchId, a.id AS senderId, b.id AS receiverId,
             r.message AS message, r.compatibilityScore AS compatibilityScore, r.createdAt AS createdAt
      `,
      { matchId },
      false,
    );
    if (pending[0]) {
      const row = pending[0];
      return {
        matchId: row.matchId,
        senderId: row.senderId,
        receiverId: row.receiverId,
        message: row.message,
        compatibilityScore: row.compatibilityScore,
        status: 'pending',
        createdAt: row.createdAt ? String(row.createdAt) : null,
        updatedAt: row.createdAt ? String(row.createdAt) : null,
      };
    }

    const matched = await this.run<{
      matchId: string;
      senderId: string;
      receiverId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
      updatedAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User)-[r:MATCHED {matchId: $matchId}]->(b:User)
      RETURN r.matchId AS matchId, a.id AS senderId, b.id AS receiverId,
             r.message AS message, r.compatibilityScore AS compatibilityScore,
             r.createdAt AS createdAt, r.updatedAt AS updatedAt
      LIMIT 1
      `,
      { matchId },
      false,
    );
    if (!matched[0]) return null;
    const row = matched[0];
    return {
      matchId: row.matchId,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      compatibilityScore: row.compatibilityScore,
      status: 'accepted',
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    };
  }

  async hasAnyRelationship(userA: string, userB: string): Promise<boolean> {
    const rows = await this.run<{ exists: boolean }>(
      `
      MATCH (a:User {id: $userA}), (b:User {id: $userB})
      RETURN EXISTS {
        MATCH (a)-[:INTEREST_SENT|MATCHED|BLOCKED]-(b)
      } AS exists
      `,
      { userA, userB },
      false,
    );
    return Boolean(rows[0]?.exists);
  }

  async getReceivedInterests(userId: string): Promise<Neo4jInterestRecord[]> {
    const rows = await this.run<{
      matchId: string;
      senderId: string;
      receiverId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User)-[r:INTEREST_SENT]->(b:User {id: $userId})
      RETURN r.matchId AS matchId, a.id AS senderId, b.id AS receiverId,
             r.message AS message, r.compatibilityScore AS compatibilityScore, r.createdAt AS createdAt
      ORDER BY r.createdAt DESC
      `,
      { userId },
      false,
    );
    return rows.map((row) => ({
      matchId: row.matchId,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      compatibilityScore: row.compatibilityScore,
      status: 'pending' as const,
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: row.createdAt ? String(row.createdAt) : null,
    }));
  }

  async getSentInterests(userId: string): Promise<Neo4jInterestRecord[]> {
    const rows = await this.run<{
      matchId: string;
      senderId: string;
      receiverId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User {id: $userId})-[r:INTEREST_SENT]->(b:User)
      RETURN r.matchId AS matchId, a.id AS senderId, b.id AS receiverId,
             r.message AS message, r.compatibilityScore AS compatibilityScore, r.createdAt AS createdAt
      ORDER BY r.createdAt DESC
      `,
      { userId },
      false,
    );
    return rows.map((row) => ({
      matchId: row.matchId,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      compatibilityScore: row.compatibilityScore,
      status: 'pending' as const,
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: row.createdAt ? String(row.createdAt) : null,
    }));
  }

  async getMatchedPairs(userId: string): Promise<Neo4jInterestRecord[]> {
    const rows = await this.run<{
      matchId: string;
      partnerId: string;
      message: string | null;
      compatibilityScore: number | null;
      createdAt: { toString(): string } | string | null;
      updatedAt: { toString(): string } | string | null;
    }>(
      `
      MATCH (a:User {id: $userId})-[r:MATCHED]->(b:User)
      RETURN coalesce(r.matchId, a.id + ':' + b.id) AS matchId,
             b.id AS partnerId,
             r.message AS message,
             r.compatibilityScore AS compatibilityScore,
             r.createdAt AS createdAt,
             r.updatedAt AS updatedAt
      ORDER BY coalesce(r.updatedAt, r.createdAt) DESC
      `,
      { userId },
      false,
    );
    return rows.map((row) => ({
      matchId: row.matchId,
      senderId: userId,
      receiverId: row.partnerId,
      message: row.message,
      compatibilityScore: row.compatibilityScore,
      status: 'accepted' as const,
      createdAt: row.createdAt ? String(row.createdAt) : null,
      updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    }));
  }

  async isMatched(userA: string, userB: string): Promise<boolean> {
    const rows = await this.run<{ exists: boolean }>(
      `
      MATCH (a:User {id: $userA}), (b:User {id: $userB})
      RETURN EXISTS { MATCH (a)-[:MATCHED]-(b) } AS exists
      `,
      { userA, userB },
      false,
    );
    return Boolean(rows[0]?.exists);
  }

  // ─── Block / Ignore / View ────────────────────────────────────────────────

  async createBlocked(fromUserId: string, toUserId: string, matchId?: string): Promise<void> {
    await this.run(
      `
      MERGE (a:User {id: $fromUserId})
      MERGE (b:User {id: $toUserId})
      MERGE (a)-[r:BLOCKED]->(b)
      ON CREATE SET r.createdAt = datetime(), r.matchId = $matchId
      SET r.updatedAt = datetime(),
          r.matchId = coalesce($matchId, r.matchId)
      WITH a, b
      OPTIONAL MATCH (a)-[i:INTEREST_SENT]-(b)
      DELETE i
      WITH a, b
      OPTIONAL MATCH (a)-[m:MATCHED]-(b)
      DELETE m
      `,
      { fromUserId, toUserId, matchId: matchId ?? null },
    );
  }

  async deleteBlocked(fromUserId: string, toUserId: string): Promise<boolean> {
    const rows = await this.run<{ deleted: number }>(
      `
      MATCH (a:User {id: $fromUserId})-[r:BLOCKED]->(b:User {id: $toUserId})
      DELETE r
      RETURN count(*) AS deleted
      `,
      { fromUserId, toUserId },
    );
    return (rows[0]?.deleted ?? 0) > 0;
  }

  async restoreMatchedAfterUnblock(
    userA: string,
    userB: string,
    matchId?: string,
  ): Promise<void> {
    await this.run(
      `
      MERGE (a:User {id: $userA})
      MERGE (b:User {id: $userB})
      MERGE (a)-[m:MATCHED]->(b)
      MERGE (b)-[m2:MATCHED]->(a)
      SET m.matchId = coalesce($matchId, m.matchId),
          m.updatedAt = datetime(),
          m.createdAt = coalesce(m.createdAt, datetime()),
          m2.matchId = coalesce($matchId, m2.matchId),
          m2.updatedAt = datetime(),
          m2.createdAt = coalesce(m2.createdAt, datetime())
      `,
      { userA, userB, matchId: matchId ?? null },
    );
  }

  async isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
    const rows = await this.run<{ exists: boolean }>(
      `
      MATCH (a:User {id: $userA}), (b:User {id: $userB})
      RETURN EXISTS { MATCH (a)-[:BLOCKED]-(b) } AS exists
      `,
      { userA, userB },
      false,
    );
    return Boolean(rows[0]?.exists);
  }

  async createIgnored(fromUserId: string, toUserId: string): Promise<void> {
    await this.run(
      `
      MERGE (a:User {id: $fromUserId})
      MERGE (b:User {id: $toUserId})
      MERGE (a)-[r:IGNORED]->(b)
      ON CREATE SET r.createdAt = datetime()
      `,
      { fromUserId, toUserId },
    );
  }

  async createViewed(fromUserId: string, toUserId: string): Promise<void> {
    await this.run(
      `
      MERGE (a:User {id: $fromUserId})
      MERGE (b:User {id: $toUserId})
      MERGE (a)-[r:VIEWED]->(b)
      ON CREATE SET r.createdAt = datetime(), r.viewCount = 1
      ON MATCH SET r.lastViewedAt = datetime(), r.viewCount = coalesce(r.viewCount, 0) + 1
      `,
      { fromUserId, toUserId },
    );
  }

  /**
   * User IDs that should never appear in discovery / recommendations.
   */
  async getExcludedUserIds(userId: string): Promise<string[]> {
    const rows = await this.run<{ otherId: string }>(
      `
      MATCH (me:User {id: $userId})-[r:BLOCKED|IGNORED|MATCHED|INTEREST_SENT]-(other:User)
      RETURN DISTINCT other.id AS otherId
      `,
      { userId },
      false,
    );
    return rows.map((r) => r.otherId).filter(Boolean);
  }

  /**
   * Recommendation engine: return candidate User IDs only (no profile data).
   * Prefers users viewed by people the viewer matched with (1-hop social signal),
   * then other completed profiles not already related.
   */
  async getRecommendationUserIds(userId: string, limit = 40): Promise<string[]> {
    const rows = await this.run<{ candidateId: string; score: number }>(
      `
      MATCH (me:User {id: $userId})
      OPTIONAL MATCH (me)-[:MATCHED]->(friend:User)-[:VIEWED|SHORTLISTED]->(candidate:User)
      WHERE candidate.id <> $userId
        AND candidate.profileCompleted = true
        AND NOT (me)-[:BLOCKED|IGNORED|MATCHED|INTEREST_SENT]-(candidate)
        AND NOT (candidate)-[:BLOCKED]->(me)
      WITH candidate, count(*) AS boost
      WHERE candidate IS NOT NULL
      RETURN candidate.id AS candidateId, boost AS score
      ORDER BY score DESC
      LIMIT $limit
      `,
      { userId, limit },
      false,
    );

    if (rows.length >= Math.min(10, limit)) {
      return rows.map((r) => r.candidateId);
    }

    const fallback = await this.run<{ candidateId: string }>(
      `
      MATCH (me:User {id: $userId})
      MATCH (candidate:User)
      WHERE candidate.id <> $userId
        AND candidate.profileCompleted = true
        AND NOT (me)-[:BLOCKED|IGNORED|MATCHED|INTEREST_SENT]-(candidate)
        AND NOT (candidate)-[:BLOCKED]->(me)
      RETURN candidate.id AS candidateId
      LIMIT $limit
      `,
      { userId, limit },
      false,
    );

    const seen = new Set(rows.map((r) => r.candidateId));
    const merged = [...rows.map((r) => r.candidateId)];
    for (const row of fallback) {
      if (!seen.has(row.candidateId)) {
        seen.add(row.candidateId);
        merged.push(row.candidateId);
      }
      if (merged.length >= limit) break;
    }
    return merged;
  }

  /** Relationship status summary for buildInterestStatusMap. */
  async getRelationshipSummaries(userId: string): Promise<
    Array<{
      partnerId: string;
      matchId: string | null;
      kind: 'pending_sent' | 'pending_received' | 'accepted' | 'blocked' | 'ignored';
    }>
  > {
    const rows = await this.run<{
      partnerId: string;
      matchId: string | null;
      kind: 'pending_sent' | 'pending_received' | 'accepted' | 'blocked' | 'ignored';
    }>(
      `
      MATCH (me:User {id: $userId})
      CALL {
        WITH me
        MATCH (me)-[r:INTEREST_SENT]->(other:User)
        RETURN other.id AS partnerId, r.matchId AS matchId, 'pending_sent' AS kind
        UNION
        WITH me
        MATCH (other:User)-[r:INTEREST_SENT]->(me)
        RETURN other.id AS partnerId, r.matchId AS matchId, 'pending_received' AS kind
        UNION
        WITH me
        MATCH (me)-[r:MATCHED]->(other:User)
        RETURN other.id AS partnerId, r.matchId AS matchId, 'accepted' AS kind
        UNION
        WITH me
        MATCH (me)-[r:BLOCKED]->(other:User)
        RETURN other.id AS partnerId, r.matchId AS matchId, 'blocked' AS kind
        UNION
        WITH me
        MATCH (me)-[:IGNORED]->(other:User)
        RETURN other.id AS partnerId, null AS matchId, 'ignored' AS kind
      }
      RETURN partnerId, matchId, kind
      `,
      { userId },
      false,
    );
    return rows;
  }

  /** Graph boost profile proximity — returns user IDs (caller maps to Mongo profiles). */
  async getGraphBoostUserIds(userId: string, limit = 20): Promise<string[]> {
    return this.getRecommendationUserIds(userId, limit);
  }

  /** Expose relation type enum for callers that need typed labels. */
  get relationTypes() {
    return Neo4jRelationType;
  }
}
