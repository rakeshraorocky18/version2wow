import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Match } from './entities/match.entity';
import { Shortlist } from './entities/shortlist.entity';
import { MatchStatus } from '../../common/enums';
import { ProfileSearchQueryDto, SendInterestDto } from './dto/matchmaking.dto';
import { UsersService } from '../users/users.service.mongodb';
import { calculateCompatibility } from './engines/compatibility.engine';
import { buildSuggestionFilters, mergeFilters, resolveOppositeGenderFilter } from './engines/filter.engine';
import {
  applyPremiumMatchBoost,
  enrichWithPremiumBoost,
  sortProfilesByListingPriority,
  SUBSCRIPTION_PLANS,
  BOOST_DURATION_HOURS,
  getPlanById,
  isActiveBoost,
  resolveSubscriptionType,
} from './engines/premium.engine';
import { isHoroscopeCompatible } from './engines/horoscope.engine';
import { Neo4jService } from '../../neo4j/neo4j.service';
import { Neo4jInterestRecord } from '../../neo4j/neo4j.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { SQLITE_CONNECTION } from '../../config/database.constants';
import {
  maskProfilesForDiscovery,
  stripGalleryFromProfile,
  toLimitedProfileView,
} from './utils/profile-privacy';

@Injectable()
export class MatchmakingService {
  constructor(
    @InjectRepository(Match, SQLITE_CONNECTION)
    private matchRepository: Repository<Match>,
    @InjectRepository(Shortlist, SQLITE_CONNECTION)
    private shortlistRepository: Repository<Shortlist>,
    private usersService: UsersService,
    private neo4jService: Neo4jService,
    private notificationsService: NotificationsService,
  ) {}

  /** Keep a minimal User node in Neo4j in sync with Mongo profile flags. */
  private async syncNeo4jUser(userId: string, profile?: object | null): Promise<void> {
    const p =
      (profile as { userId?: string; gender?: string; isComplete?: boolean; profileCompleted?: boolean } | null) ||
      (await this.usersService.getProfileOrNull(userId));
    await this.neo4jService.upsertUserNode({
      id: userId,
      gender: p?.gender ?? null,
      profileCompleted: Boolean(p?.isComplete ?? p?.profileCompleted),
    });
  }

  /** Map Neo4j interest/match records into the Match shape used by existing APIs. */
  private interestToMatch(record: Neo4jInterestRecord): Match {
    const status =
      record.status === 'accepted'
        ? MatchStatus.ACCEPTED
        : record.status === 'blocked'
          ? MatchStatus.BLOCKED
          : record.status === 'rejected'
            ? MatchStatus.REJECTED
            : MatchStatus.PENDING;
    return {
      id: record.matchId,
      senderId: record.senderId,
      receiverId: record.receiverId,
      status,
      compatibilityScore: record.compatibilityScore ?? null,
      message: record.message ?? null,
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
    } as Match;
  }

  private async resolveReceiverUserId(receiverId: string): Promise<string> {
    try {
      const profile = await this.usersService.getProfileByIdOrUserId(receiverId);
      return profile.userId;
    } catch {
      return receiverId;
    }
  }

  /** Normalize stored sender/receiver ids that may be profile ids instead of user ids. */
  private async resolveUserId(idOrUserId: string): Promise<string> {
    try {
      const profile = await this.usersService.getProfileByIdOrUserId(idOrUserId);
      return profile.userId;
    } catch {
      return idOrUserId;
    }
  }

  private pairKey(userA: string, userB: string): string {
    return [userA, userB].sort().join(':');
  }

  /** Fix legacy rows and drop stale pending duplicates when a settled match already exists. */
  private async cleanupStaleInterestRecords(userId: string): Promise<void> {
    const seen = new Map<string, Match>();
    const rawMatches = await this.matchRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
    });
    rawMatches.forEach((m) => seen.set(m.id, m));

    const profile = await this.usersService.getProfileOrNull(userId);
    if (profile?.id) {
      const byProfileId = await this.matchRepository.find({
        where: [{ senderId: profile.id }, { receiverId: profile.id }],
      });
      byProfileId.forEach((m) => seen.set(m.id, m));
    }

    const matches = Array.from(seen.values());
    if (!matches.length) return;

    type Normalized = { match: Match; senderId: string; receiverId: string };
    const normalized: Normalized[] = await Promise.all(
      matches.map(async (match) => {
        const senderId = await this.resolveUserId(match.senderId);
        const receiverId = await this.resolveUserId(match.receiverId);
        if (senderId !== match.senderId || receiverId !== match.receiverId) {
          match.senderId = senderId;
          match.receiverId = receiverId;
          await this.matchRepository.save(match);
        }
        return { match, senderId, receiverId };
      }),
    );

    const settledPairs = new Set<string>();
    const pendingByPair = new Map<string, Normalized[]>();

    for (const entry of normalized) {
      const key = this.pairKey(entry.senderId, entry.receiverId);
      if (entry.match.status === MatchStatus.PENDING) {
        const list = pendingByPair.get(key) || [];
        list.push(entry);
        pendingByPair.set(key, list);
      } else if (
        entry.match.status === MatchStatus.ACCEPTED ||
        entry.match.status === MatchStatus.REJECTED
      ) {
        settledPairs.add(key);
      }
    }

    for (const [key, pendingList] of pendingByPair) {
      if (settledPairs.has(key)) {
        for (const { match } of pendingList) {
          await this.matchRepository.remove(match);
        }
        continue;
      }
      if (pendingList.length > 1) {
        const sorted = [...pendingList].sort(
          (a, b) => new Date(b.match.createdAt).getTime() - new Date(a.match.createdAt).getTime(),
        );
        for (const { match } of sorted.slice(1)) {
          await this.matchRepository.remove(match);
        }
      }
    }
  }

  private async hasExistingInterest(senderId: string, receiverUserId: string): Promise<boolean> {
    if (this.neo4jService.isEnabled()) {
      return this.neo4jService.hasExistingInterestOrMatch(senderId, receiverUserId);
    }
    const related = await this.matchRepository.find({
      where: [{ senderId }, { receiverId: senderId }],
    });
    for (const match of related) {
      const s = await this.resolveUserId(match.senderId);
      const r = await this.resolveUserId(match.receiverId);
      if (
        (s === senderId && r === receiverUserId) ||
        (s === receiverUserId && r === senderId)
      ) {
        return true;
      }
    }
    return false;
  }

  private async getViewerProfile(userId: string) {
    const profile = await this.usersService.getProfileOrNull(userId);
    if (!profile) {
      throw new BadRequestException('Complete your profile before using matchmaking');
    }
    await this.syncNeo4jUser(userId, profile);
    return profile;
  }

  /**
   * Hide self and anyone not available for a new connection:
   * accepted matches, pending requests, rejected, blocked, ignored.
   */
  private async excludeUserIds(userId: string): Promise<string[]> {
    const excluded = new Set<string>();
    const selfUserId = await this.resolveUserId(userId);
    excluded.add(selfUserId);
    if (userId !== selfUserId) excluded.add(userId);

    if (this.neo4jService.isEnabled()) {
      const graphExcluded = await this.neo4jService.getExcludedUserIds(selfUserId);
      graphExcluded.forEach((id) => excluded.add(id));
      // Also exclude users who blocked the viewer
      return Array.from(excluded);
    }

    const selfProfile = await this.usersService.getProfileOrNull(selfUserId);
    const lookupIds = [
      ...new Set([selfUserId, userId, ...(selfProfile?.id ? [selfProfile.id] : [])]),
    ];

    const matches = await this.matchRepository.find({
      where: lookupIds.flatMap((uid) => [{ senderId: uid }, { receiverId: uid }]),
    });

    for (const match of matches) {
      if (
        match.status !== MatchStatus.ACCEPTED &&
        match.status !== MatchStatus.PENDING &&
        match.status !== MatchStatus.REJECTED &&
        match.status !== MatchStatus.BLOCKED
      ) {
        continue;
      }
      const senderId = await this.resolveUserId(match.senderId);
      const receiverId = await this.resolveUserId(match.receiverId);
      const partnerId = senderId === selfUserId ? receiverId : senderId;
      if (partnerId && partnerId !== selfUserId) {
        excluded.add(partnerId);
      }
    }

    return Array.from(excluded);
  }

  private scoreProfiles(
    viewer: object | null,
    profiles: object[],
    includeHoroscope = true,
    graphBoostIds: string[] = [],
  ) {
    if (!viewer) {
      return profiles as Record<string, unknown>[];
    }
    const viewerRecord = viewer as Record<string, unknown>;
    const scored = profiles.map((candidate) => {
      const candidateRecord = candidate as Record<string, unknown>;
      const compatibility = calculateCompatibility(viewerRecord, candidateRecord, { includeHoroscope });
      let score = compatibility.score;
      if (
        graphBoostIds.includes(candidateRecord.id as string) ||
        graphBoostIds.includes(candidateRecord.userId as string)
      ) {
        score = Math.min(100, score + 8);
      }
      score = applyPremiumMatchBoost(score, candidateRecord);
      return enrichWithPremiumBoost(
        {
          ...candidateRecord,
          compatibility,
        },
        score,
      );
    });
    return sortProfilesByListingPriority(scored as Record<string, unknown>[]);
  }

  async getPremiumStatus(userId: string) {
    await this.usersService.clearExpiredBoost(userId);
    const profile = await this.usersService.getProfileOrNull(userId);
    const subscriptionType = profile
      ? resolveSubscriptionType(profile as unknown as Record<string, unknown>)
      : 'Free';
    const isPremium = subscriptionType !== 'Free';
    const isBoosted = profile
      ? isActiveBoost(profile as unknown as Record<string, unknown>)
      : false;
    const boostExpiresAt = profile?.boostExpiresAt || null;

    return {
      subscriptionType,
      isPremium,
      isBoosted,
      boostExpiresAt,
      hasActiveSubscription: isPremium,
      paymentIntegrationEnabled: false,
      benefits: {
        boostedProfile: isPremium,
        priorityInMatchListings: isPremium,
        profileBoost: isPremium || isBoosted,
      },
    };
  }

  getPremiumPlans() {
    return {
      plans: SUBSCRIPTION_PLANS,
      boostDurationHours: BOOST_DURATION_HOURS,
      paymentIntegrationEnabled: false,
    };
  }

  async subscribeToPlan(userId: string, planId: string) {
    const plan = getPlanById(planId);
    if (!plan) throw new BadRequestException('Invalid subscription plan');
    await this.usersService.setSubscription(userId, plan.subscriptionType);
    return this.getPremiumStatus(userId);
  }

  async activateProfileBoost(userId: string) {
    const status = await this.getPremiumStatus(userId);
    if (!status.hasActiveSubscription && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Upgrade to a premium plan to boost your profile');
    }
    const profile = await this.usersService.activateProfileBoost(userId, BOOST_DURATION_HOURS);
    return {
      isBoosted: isActiveBoost(profile as unknown as Record<string, unknown>),
      boostExpiresAt: profile.boostExpiresAt,
      durationHours: BOOST_DURATION_HOURS,
    };
  }

  /** Dev-only: toggle isPremium until Razorpay is integrated. */
  async setDevPremiumStatus(userId: string, isPremium: boolean) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Not available in production');
    }
    await this.usersService.setPremiumStatus(userId, isPremium);
    return this.getPremiumStatus(userId);
  }

  async sendInterest(senderId: string, dto: SendInterestDto): Promise<Match> {
    const receiverUserId = await this.resolveReceiverUserId(dto.receiverId);
    if (receiverUserId === senderId) {
      throw new BadRequestException('You cannot send interest to yourself');
    }

    await this.cleanupStaleInterestRecords(senderId);

    if (await this.hasExistingInterest(senderId, receiverUserId)) {
      throw new ConflictException('Interest already exists between these users');
    }

    const viewer = await this.getViewerProfile(senderId);
    if (!(viewer as { isComplete?: boolean }).isComplete) {
      throw new BadRequestException('Complete your profile before sending interest');
    }

    let receiverProfile: Record<string, unknown>;
    try {
      receiverProfile = (await this.usersService.getProfileById(dto.receiverId)) as unknown as Record<string, unknown>;
    } catch {
      const receiver = await this.usersService.getProfile(receiverUserId);
      receiverProfile = receiver as unknown as Record<string, unknown>;
    }

    if (!receiverProfile.isComplete) {
      throw new BadRequestException('This profile is not available for match requests yet');
    }

    await this.syncNeo4jUser(receiverUserId, receiverProfile);

    const compatibility = calculateCompatibility(viewer, receiverProfile, { includeHoroscope: true });

    // Dual-write: SQLite keeps Match IDs for chat; Neo4j stores INTEREST_SENT relationship.
    const match = this.matchRepository.create({
      senderId,
      receiverId: receiverUserId,
      message: dto.message,
      status: MatchStatus.PENDING,
      compatibilityScore: compatibility.score,
    });
    const saved = await this.matchRepository.save(match);

    if (this.neo4jService.isEnabled()) {
      await this.neo4jService.sendInterest({
        matchId: saved.id,
        senderId,
        receiverId: receiverUserId,
        message: dto.message,
        compatibilityScore: compatibility.score,
      });
    }

    const senderName = [(viewer as { firstName?: string }).firstName, (viewer as { lastName?: string }).lastName]
      .filter(Boolean)
      .join(' ') || 'Someone';
    await this.notificationsService.sendMatchNotification(receiverUserId, senderName);

    return saved;
  }

  async acceptInterest(userId: string, matchId: string): Promise<Match> {
    const normalizedUser = await this.resolveUserId(userId);

    if (this.neo4jService.isEnabled()) {
      const graph = await this.neo4jService.acceptInterest(matchId, normalizedUser);
      if (graph) {
        const sqlite = await this.matchRepository.findOne({ where: { id: matchId } });
        if (sqlite) {
          sqlite.status = MatchStatus.ACCEPTED;
          sqlite.senderId = graph.senderId;
          sqlite.receiverId = graph.receiverId;
          await this.matchRepository.save(sqlite);
        }
        const accepter = await this.usersService.getProfileOrNull(normalizedUser);
        const accepterName =
          [(accepter as { firstName?: string } | null)?.firstName, (accepter as { lastName?: string } | null)?.lastName]
            .filter(Boolean)
            .join(' ') || 'Someone';
        await this.notificationsService.sendNotification({
          userId: graph.senderId,
          title: 'Interest Accepted!',
          body: `${accepterName} accepted your interest. You can now view their full profile and chat.`,
          type: 'match',
          data: { matchId: graph.matchId, status: MatchStatus.ACCEPTED },
        });
        return this.interestToMatch(graph);
      }
    }

    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match request not found');

    const receiverUserId = await this.resolveUserId(match.receiverId);
    const userProfile = await this.usersService.getProfileOrNull(normalizedUser);
    const isReceiver =
      receiverUserId === normalizedUser ||
      match.receiverId === userId ||
      match.receiverId === normalizedUser ||
      (userProfile?.id != null && match.receiverId === userProfile.id);

    if (!isReceiver) throw new NotFoundException('Match request not found');

    match.status = MatchStatus.ACCEPTED;
    match.senderId = await this.resolveUserId(match.senderId);
    match.receiverId = receiverUserId;
    const saved = await this.matchRepository.save(match);

    if (this.neo4jService.isEnabled()) {
      await this.neo4jService.acceptInterest(matchId, receiverUserId);
    }

    const accepter = await this.usersService.getProfileOrNull(normalizedUser);
    const accepterName =
      [(accepter as { firstName?: string } | null)?.firstName, (accepter as { lastName?: string } | null)?.lastName]
        .filter(Boolean)
        .join(' ') || 'Someone';
    await this.notificationsService.sendNotification({
      userId: match.senderId,
      title: 'Interest Accepted!',
      body: `${accepterName} accepted your interest. You can now view their full profile and chat.`,
      type: 'match',
      data: { matchId: saved.id, status: MatchStatus.ACCEPTED },
    });

    return saved;
  }

  async rejectInterest(userId: string, matchId: string): Promise<Match> {
    const normalizedUser = await this.resolveUserId(userId);

    if (this.neo4jService.isEnabled()) {
      const graph = await this.neo4jService.rejectInterest(matchId, normalizedUser);
      if (graph) {
        const sqlite = await this.matchRepository.findOne({ where: { id: matchId } });
        if (sqlite) {
          sqlite.status = MatchStatus.REJECTED;
          sqlite.senderId = graph.senderId;
          sqlite.receiverId = graph.receiverId;
          await this.matchRepository.save(sqlite);
          return sqlite;
        }
        return this.interestToMatch(graph);
      }
    }

    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match request not found');

    const receiverUserId = await this.resolveUserId(match.receiverId);
    const userProfile = await this.usersService.getProfileOrNull(normalizedUser);
    const isReceiver =
      receiverUserId === normalizedUser ||
      match.receiverId === userId ||
      match.receiverId === normalizedUser ||
      (userProfile?.id != null && match.receiverId === userProfile.id);

    if (!isReceiver) throw new NotFoundException('Match request not found');

    match.status = MatchStatus.REJECTED;
    match.senderId = await this.resolveUserId(match.senderId);
    match.receiverId = receiverUserId;
    return this.matchRepository.save(match);
  }

  /** Block a user — Neo4j BLOCKED relationship; dual-write SQLite for chat. */
  async blockUser(userId: string, targetUserIdOrProfileId: string): Promise<Match> {
    const normalizedUser = await this.resolveUserId(userId);
    const targetUserId = await this.resolveUserId(targetUserIdOrProfileId);
    if (normalizedUser === targetUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    await this.syncNeo4jUser(normalizedUser);
    await this.syncNeo4jUser(targetUserId);

    const expectedPair = this.pairKey(normalizedUser, targetUserId);
    const viewerProfile = await this.usersService.getProfileOrNull(normalizedUser);
    const targetProfile = await this.usersService.getProfileOrNull(targetUserId);
    const lookupIds = [
      ...new Set(
        [normalizedUser, targetUserId, viewerProfile?.id, targetProfile?.id].filter(Boolean),
      ),
    ] as string[];

    const related = await this.matchRepository.find({
      where: lookupIds.flatMap((uid) => [{ senderId: uid }, { receiverId: uid }]),
    });

    let match: Match | null = null;
    for (const row of related) {
      const senderId = await this.resolveUserId(row.senderId);
      const receiverId = await this.resolveUserId(row.receiverId);
      if (this.pairKey(senderId, receiverId) === expectedPair) {
        match = row;
        break;
      }
    }

    if (!match) {
      match = this.matchRepository.create({
        senderId: normalizedUser,
        receiverId: targetUserId,
        status: MatchStatus.BLOCKED,
      });
    } else {
      match.senderId = await this.resolveUserId(match.senderId);
      match.receiverId = await this.resolveUserId(match.receiverId);
      match.status = MatchStatus.BLOCKED;
    }

    const saved = await this.matchRepository.save(match);

    if (this.neo4jService.isEnabled()) {
      await this.neo4jService.blockUser(normalizedUser, targetUserId, saved.id);
    }

    return saved;
  }

  /** Restore a blocked pair to matched so chat messaging works again. */
  async unblockUser(userId: string, targetUserIdOrProfileId: string): Promise<Match> {
    const normalizedUser = await this.resolveUserId(userId);
    const targetUserId = await this.resolveUserId(targetUserIdOrProfileId);
    if (normalizedUser === targetUserId) {
      throw new BadRequestException('You cannot unblock yourself');
    }

    if (this.neo4jService.isEnabled()) {
      const removed = await this.neo4jService.unblockUser(normalizedUser, targetUserId);
      if (!removed) {
        // Also try reverse direction for legacy/dual blocks
        await this.neo4jService.unblockUser(targetUserId, normalizedUser);
      }
    }

    const expectedPair = this.pairKey(normalizedUser, targetUserId);
    const viewerProfile = await this.usersService.getProfileOrNull(normalizedUser);
    const targetProfile = await this.usersService.getProfileOrNull(targetUserId);
    const lookupIds = [
      ...new Set(
        [normalizedUser, targetUserId, viewerProfile?.id, targetProfile?.id].filter(Boolean),
      ),
    ] as string[];

    const related = await this.matchRepository.find({
      where: lookupIds.flatMap((uid) => [{ senderId: uid }, { receiverId: uid }]),
    });

    for (const row of related) {
      const senderId = await this.resolveUserId(row.senderId);
      const receiverId = await this.resolveUserId(row.receiverId);
      if (this.pairKey(senderId, receiverId) !== expectedPair) continue;
      if (row.status !== MatchStatus.BLOCKED) {
        throw new BadRequestException('This user is not blocked');
      }
      row.senderId = senderId;
      row.receiverId = receiverId;
      row.status = MatchStatus.ACCEPTED;
      const saved = await this.matchRepository.save(row);
      if (this.neo4jService.isEnabled()) {
        await this.neo4jService.restoreMatch(senderId, receiverId, saved.id);
      }
      return saved;
    }

    throw new NotFoundException('Blocked relationship not found');
  }

  /** Ignore a user so they are excluded from recommendations. */
  async ignoreUser(userId: string, targetUserIdOrProfileId: string): Promise<{ ignored: boolean }> {
    const normalizedUser = await this.resolveUserId(userId);
    const targetUserId = await this.resolveUserId(targetUserIdOrProfileId);
    if (normalizedUser === targetUserId) {
      throw new BadRequestException('You cannot ignore yourself');
    }
    await this.syncNeo4jUser(normalizedUser);
    await this.syncNeo4jUser(targetUserId);
    if (!this.neo4jService.isEnabled()) {
      throw new BadRequestException('Ignore requires Neo4j to be configured');
    }
    await this.neo4jService.ignoreUser(normalizedUser, targetUserId);
    return { ignored: true };
  }

  private async receiverIdVariants(userId: string): Promise<string[]> {
    const normalizedUser = await this.resolveUserId(userId);
    const profile = await this.usersService.getProfileOrNull(normalizedUser);
    return Array.from(
      new Set([userId, normalizedUser, ...(profile?.id ? [profile.id] : [])]),
    );
  }

  async getReceivedInterests(userId: string) {
    await this.cleanupStaleInterestRecords(userId);
    const normalizedUser = await this.resolveUserId(userId);

    if (this.neo4jService.isEnabled()) {
      const graphRows = await this.neo4jService.getReceivedInterests(normalizedUser);
      if (graphRows.length) {
        return this.attachProfilesToMatches(
          graphRows.map((r) => this.interestToMatch(r)),
          normalizedUser,
        );
      }
    }

    const receiverIds = await this.receiverIdVariants(userId);
    const raw = await this.matchRepository.find({
      where: receiverIds.map((receiverId) => ({
        receiverId,
        status: MatchStatus.PENDING,
      })),
      order: { createdAt: 'DESC' },
    });
    const matches = Array.from(new Map(raw.map((m) => [m.id, m])).values());
    return this.attachProfilesToMatches(matches, normalizedUser);
  }

  /** Map profile/user ids to relationship status for the current viewer. */
  private async buildInterestStatusMap(userId: string) {
    type Status = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
    type Entry = { interestStatus: Status; matchId: string; partnerUserId: string };
    const priority = (s: Status) =>
      ({ accepted: 5, pending_sent: 4, pending_received: 4, rejected: 2, none: 0 })[s];

    const viewerId = await this.resolveUserId(userId);
    const map = new Map<string, Entry>();

    if (this.neo4jService.isEnabled()) {
      const summaries = await this.neo4jService.getRelationshipSummaries(viewerId);
      for (const row of summaries) {
        let interestStatus: Status;
        if (row.kind === 'accepted') interestStatus = 'accepted';
        else if (row.kind === 'pending_sent') interestStatus = 'pending_sent';
        else if (row.kind === 'pending_received') interestStatus = 'pending_received';
        else if (row.kind === 'blocked' || row.kind === 'ignored') interestStatus = 'rejected';
        else continue;

        const partnerProfile = await this.usersService.getProfileOrNull(row.partnerId);
        const entry: Entry = {
          interestStatus,
          matchId: row.matchId || `${viewerId}:${row.partnerId}`,
          partnerUserId: row.partnerId,
        };
        const keys = [row.partnerId, partnerProfile?.id].filter(Boolean) as string[];
        for (const key of keys) {
          const existing = map.get(key);
          if (!existing || priority(interestStatus) > priority(existing.interestStatus)) {
            map.set(key, entry);
          }
        }
      }
      if (map.size) return map;
    }

    const viewerProfile = await this.usersService.getProfileOrNull(viewerId);
    const lookupIds = [...new Set([userId, viewerId, viewerProfile?.id].filter(Boolean))] as string[];

    const rawMatches = await this.matchRepository.find({
      where: lookupIds.flatMap((uid) => [{ senderId: uid }, { receiverId: uid }]),
    });

    for (const match of rawMatches) {
      const senderId = await this.resolveUserId(match.senderId);
      const receiverId = await this.resolveUserId(match.receiverId);
      if (senderId !== viewerId && receiverId !== viewerId) continue;

      let interestStatus: Status;
      if (match.status === MatchStatus.ACCEPTED) interestStatus = 'accepted';
      else if (match.status === MatchStatus.REJECTED || match.status === MatchStatus.BLOCKED) {
        interestStatus = 'rejected';
      } else if (match.status === MatchStatus.PENDING) {
        interestStatus = senderId === viewerId ? 'pending_sent' : 'pending_received';
      } else continue;

      const partnerUserId = senderId === viewerId ? receiverId : senderId;
      const partnerProfile = await this.usersService.getProfileOrNull(partnerUserId);
      const entry: Entry = { interestStatus, matchId: match.id, partnerUserId };
      const keys = [partnerUserId, partnerProfile?.id].filter(Boolean) as string[];

      for (const key of keys) {
        const existing = map.get(key);
        if (!existing || priority(interestStatus) > priority(existing.interestStatus)) {
          map.set(key, entry);
        }
      }
    }

    return map;
  }

  private attachInterestStatusToProfiles(
    profiles: Record<string, unknown>[],
    statusMap: Map<
      string,
      { interestStatus: string; matchId: string; partnerUserId: string }
    >,
  ) {
    return profiles.map((profile) => {
      const userKey = String(profile.userId || '');
      const idKey = String(profile.id || '');
      const rel = statusMap.get(userKey) || statusMap.get(idKey);
      return {
        ...profile,
        interestStatus: rel?.interestStatus ?? 'none',
        matchId: rel?.matchId ?? null,
        matchPartnerUserId: rel?.partnerUserId ?? null,
      };
    });
  }

  async getRelationshipForProfile(viewerUserId: string, profileIdOrUserId: string) {
    const profile = await this.usersService.getProfileByIdOrUserId(profileIdOrUserId);
    const targetUserId = profile.userId;
    const statusMap = await this.buildInterestStatusMap(viewerUserId);
    return (
      statusMap.get(targetUserId) ||
      statusMap.get(profile.id) || {
        interestStatus: 'none' as const,
        matchId: null,
        partnerUserId: targetUserId,
      }
    );
  }

  async getSentInterests(userId: string) {
    await this.cleanupStaleInterestRecords(userId);
    const normalizedUser = await this.resolveUserId(userId);

    if (this.neo4jService.isEnabled()) {
      const graphRows = await this.neo4jService.getSentInterests(normalizedUser);
      if (graphRows.length) {
        return this.attachProfilesToMatches(
          graphRows.map((r) => this.interestToMatch(r)),
          normalizedUser,
        );
      }
    }

    const matches = await this.matchRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches, userId);
  }

  async getAcceptedMatches(userId: string) {
    await this.cleanupStaleInterestRecords(userId);
    const normalizedUser = await this.resolveUserId(userId);

    if (this.neo4jService.isEnabled()) {
      const graphRows = await this.neo4jService.getMatchedPairs(normalizedUser);
      if (graphRows.length) {
        // Rebuild Match rows with correct sender/receiver for profile attachment
        const asMatches = graphRows.map((row) => {
          const sqliteId = row.matchId;
          return {
            id: sqliteId,
            senderId: normalizedUser,
            receiverId: row.receiverId,
            status: MatchStatus.ACCEPTED,
            compatibilityScore: row.compatibilityScore ?? null,
            message: row.message ?? null,
            createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
          } as Match;
        });
        return this.attachProfilesToMatches(asMatches, normalizedUser);
      }
    }

    const matches = await this.matchRepository.find({
      where: [
        { senderId: userId, status: MatchStatus.ACCEPTED },
        { receiverId: userId, status: MatchStatus.ACCEPTED },
      ],
      order: { updatedAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches, userId);
  }

  private async attachProfilesToMatches(matches: Match[], forUserId?: string) {
    if (!matches.length) return [];

    const normalizedMatches = await Promise.all(
      matches.map(async (match) => {
        const senderId = await this.resolveUserId(match.senderId);
        const receiverId = await this.resolveUserId(match.receiverId);
        if (senderId !== match.senderId || receiverId !== match.receiverId) {
          match.senderId = senderId;
          match.receiverId = receiverId;
          await this.matchRepository.save(match);
        }
        return match;
      }),
    );

    const userIds = Array.from(
      new Set(normalizedMatches.flatMap((m) => [m.senderId, m.receiverId])),
    );

    const profileRows = await Promise.all(
      userIds.map(async (uid) => this.usersService.getProfileOrNull(uid)),
    );

    const byUserId = new Map(
      profileRows.filter(Boolean).map((p) => [p!.userId, p]),
    );

    return normalizedMatches.map((match) => {
      const senderProfile = byUserId.get(match.senderId) || null;
      const receiverProfile = byUserId.get(match.receiverId) || null;
      const partnerUserId =
        forUserId && match.senderId === forUserId ? match.receiverId : match.senderId;
      const partnerProfile =
        forUserId && match.senderId === forUserId ? receiverProfile : senderProfile;

      const limitOrFull = (p: object | null) => {
        if (!p) return null;
        const record = p as unknown as Record<string, unknown>;
        return match.status === MatchStatus.ACCEPTED
          ? this.applyGalleryPrivacy(record, true)
          : toLimitedProfileView(record);
      };

      return {
        ...match,
        senderProfile: limitOrFull(senderProfile),
        receiverProfile: limitOrFull(receiverProfile),
        partnerProfile: forUserId ? limitOrFull(partnerProfile) : null,
        partnerUserId: forUserId ? partnerUserId : null,
      };
    });
  }

  private applyHoroscopeMatchFilter(
    viewer: object | null,
    profiles: Record<string, unknown>[],
    query: ProfileSearchQueryDto,
  ) {
    const enabled = query.horoscopeMatch === true || query.horoscopeAvailable === true;
    if (!enabled || !viewer) return profiles;
    const viewerRecord = viewer as Record<string, unknown>;
    return profiles.filter((p) => isHoroscopeCompatible(viewerRecord, p));
  }

  private stripMatchQueryFilters(query: ProfileSearchQueryDto) {
    const { gender: _gender, horoscopeMatch: _hm, horoscopeAvailable: _ha, ...rest } = query;
    return rest;
  }

  async searchMatches(userId: string, query: ProfileSearchQueryDto, userRole?: string) {
    const viewer = await this.usersService.getProfileOrNull(userId);
    const excludeUserIds = await this.excludeUserIds(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;

    const userFilters = this.stripMatchQueryFilters(query);
    const oppositeGender = resolveOppositeGenderFilter(viewer, userRole);
    const filters = {
      ...userFilters,
      ...(oppositeGender ? { gender: oppositeGender } : {}),
    };

    const result = await this.usersService.searchProfiles(
      { ...filters },
      page,
      limit,
      { excludeUserIds },
    );

    let scored = this.maskProfilesForDiscovery(
      this.scoreProfiles(viewer, result.profiles, query.includeHoroscope !== false) as Record<string, unknown>[],
    );
    scored = this.applyHoroscopeMatchFilter(viewer, scored as Record<string, unknown>[], query);

    const statusMap = await this.buildInterestStatusMap(userId);
    scored = this.attachInterestStatusToProfiles(scored as Record<string, unknown>[], statusMap);

    return { profiles: scored, total: result.total, page, limit };
  }

  async getSuggestedMatches(userId: string, query: ProfileSearchQueryDto = {}, userRole?: string) {
    const viewer = await this.usersService.getProfileOrNull(userId);
    if (!viewer) {
      return this.searchMatches(userId, query, userRole);
    }
    await this.syncNeo4jUser(userId, viewer);

    const excludeUserIds = await this.excludeUserIds(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;

    // Neo4j recommendation engine returns User IDs only; profiles come from MongoDB.
    if (this.neo4jService.isEnabled()) {
      const recommendedIds = await this.neo4jService.getRecommendationUserIds(userId, limit * 3);
      if (recommendedIds.length) {
        const profiles = (
          await Promise.all(
            recommendedIds.map(async (uid) => {
              try {
                return await this.usersService.getProfileOrNull(uid);
              } catch {
                return null;
              }
            }),
          )
        ).filter(Boolean) as object[];

        const eligible = profiles.filter((p) => {
          const record = p as { userId?: string; isComplete?: boolean };
          return record.isComplete && record.userId && !excludeUserIds.includes(record.userId);
        });

        const graphBoostIds = recommendedIds;
        let scored = this.maskProfilesForDiscovery(
          this.scoreProfiles(
            viewer,
            eligible,
            query.includeHoroscope !== false,
            graphBoostIds,
          ) as Record<string, unknown>[],
        );
        scored = this.applyHoroscopeMatchFilter(viewer, scored as Record<string, unknown>[], query).slice(
          0,
          limit,
        );

        const statusMap = await this.buildInterestStatusMap(userId);
        scored = this.attachInterestStatusToProfiles(scored as Record<string, unknown>[], statusMap);

        return {
          profiles: scored,
          total: scored.length,
          page,
          limit,
          recommendationEngine: 'neo4j+mongo',
        };
      }
    }

    const userFilters = this.stripMatchQueryFilters(query);
    const autoFilters = buildSuggestionFilters(viewer, userRole);
    const filters = mergeFilters(autoFilters, userFilters);
    const oppositeGender = resolveOppositeGenderFilter(viewer, userRole);
    if (oppositeGender) filters.gender = oppositeGender;

    const result = await this.usersService.searchProfiles(
      { ...filters } as Record<string, unknown>,
      page,
      limit * 2,
      { excludeUserIds },
    );

    const graphBoostIds = await this.neo4jService.getGraphBoostUserIds(userId, limit);
    let scored = this.maskProfilesForDiscovery(
      this.scoreProfiles(
        viewer,
        result.profiles,
        query.includeHoroscope !== false,
        graphBoostIds,
      ) as Record<string, unknown>[],
    );
    scored = this.applyHoroscopeMatchFilter(viewer, scored as Record<string, unknown>[], query).slice(0, limit);

    const statusMap = await this.buildInterestStatusMap(userId);
    scored = this.attachInterestStatusToProfiles(scored as Record<string, unknown>[], statusMap);

    return {
      profiles: scored,
      total: result.total,
      page,
      limit,
      recommendationEngine: this.neo4jService.isEnabled() ? 'graph+rules' : 'rules',
    };
  }

  async getCompatibilityScore(userId: string, profileId: string, includeHoroscope = true) {
    const viewer = await this.getViewerProfile(userId);
    const candidate = await this.usersService.getProfileById(profileId);
    return calculateCompatibility(viewer, candidate, { includeHoroscope });
  }

  async addToShortlist(userId: string, profileId: string) {
    const profile = await this.usersService.getProfileById(profileId);
    if (profile.userId === userId) {
      throw new BadRequestException('You cannot shortlist your own profile');
    }

    await this.syncNeo4jUser(userId);
    await this.syncNeo4jUser(profile.userId, profile);

    if (this.neo4jService.isEnabled()) {
      await this.neo4jService.shortlistUser(userId, profile.userId, profileId);
    }

    const existing = await this.shortlistRepository.findOne({ where: { userId, profileId } });
    if (existing) return existing;

    const entry = this.shortlistRepository.create({ userId, profileId });
    return this.shortlistRepository.save(entry);
  }

  async removeFromShortlist(userId: string, profileId: string) {
    const profile = await this.usersService.getProfileById(profileId).catch(() => null);
    if (this.neo4jService.isEnabled() && profile?.userId) {
      await this.neo4jService.removeShortlist(userId, profile.userId);
    }

    const entry = await this.shortlistRepository.findOne({ where: { userId, profileId } });
    if (!entry) throw new NotFoundException('Shortlist entry not found');
    await this.shortlistRepository.remove(entry);
    return { removed: true };
  }

  async getShortlist(userId: string, userRole?: string) {
    const entries = await this.shortlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!entries.length) return { profiles: [], total: 0 };

    const viewer = await this.getViewerProfile(userId);
    const oppositeGender = resolveOppositeGenderFilter(viewer, userRole);
    const profiles = await Promise.all(
      entries.map(async (e) => {
        try {
          return await this.usersService.getProfileById(e.profileId);
        } catch {
          return null;
        }
      }),
    );

    const eligible = profiles.filter(Boolean).filter((p) => {
      const record = p as { gender?: string; isComplete?: boolean; userId?: string };
      if (oppositeGender && record.gender !== oppositeGender) return false;
      if (!record.isComplete) return false;
      return true;
    }) as object[];

    const excludeIds = new Set(await this.excludeUserIds(userId));
    const available = eligible.filter((p) => {
      const uid = String((p as { userId?: string }).userId || '');
      return uid && !excludeIds.has(uid);
    });

    const scored = this.maskProfilesForDiscovery(
      this.scoreProfiles(viewer, available, true) as Record<string, unknown>[],
    );

    const statusMap = await this.buildInterestStatusMap(userId);
    const withStatus = this.attachInterestStatusToProfiles(scored, statusMap);

    return { profiles: withStatus, total: withStatus.length };
  }

  async isShortlisted(userId: string, profileIds: string[]) {
    if (!profileIds.length) return {};
    const rows = await this.shortlistRepository.find({
      where: { userId, profileId: In(profileIds) },
    });
    return Object.fromEntries(profileIds.map((id) => [id, rows.some((r) => r.profileId === id)]));
  }

  async hasAcceptedMatch(viewerUserId: string, targetUserId: string): Promise<boolean> {
    const viewer = await this.resolveUserId(viewerUserId);
    const target = await this.resolveUserId(targetUserId);
    if (viewer === target) return true;

    if (this.neo4jService.isEnabled()) {
      const matched = await this.neo4jService.isMatched(viewer, target);
      if (matched) return true;
    }

    const expectedPair = this.pairKey(viewer, target);
    const viewerProfile = await this.usersService.getProfileOrNull(viewer);
    const targetProfile = await this.usersService.getProfileOrNull(target);
    const lookupIds = [...new Set([viewer, target, viewerProfile?.id, targetProfile?.id].filter(Boolean))] as string[];

    const related = await this.matchRepository.find({
      where: lookupIds.flatMap((uid) => [
        { senderId: uid, status: MatchStatus.ACCEPTED },
        { receiverId: uid, status: MatchStatus.ACCEPTED },
      ]),
    });

    const seen = new Set<string>();
    for (const match of related) {
      if (seen.has(match.id)) continue;
      seen.add(match.id);
      const senderId = await this.resolveUserId(match.senderId);
      const receiverId = await this.resolveUserId(match.receiverId);
      if (this.pairKey(senderId, receiverId) === expectedPair) return true;
    }
    return false;
  }

  private applyGalleryPrivacy(
    profile: Record<string, unknown>,
    hasMatchAccess: boolean,
  ): Record<string, unknown> {
    const visibility = (profile.galleryVisibility as string) || 'matched_only';
    const canViewGallery = hasMatchAccess || visibility === 'public';
    if (canViewGallery) return profile;
    return stripGalleryFromProfile(profile);
  }

  private maskProfilesForDiscovery(profiles: Record<string, unknown>[]) {
    return maskProfilesForDiscovery(profiles);
  }

  private toLimitedProfileView(profile: Record<string, unknown>): Record<string, unknown> {
    return toLimitedProfileView(profile);
  }

  async getMatchProfile(viewerUserId: string, profileIdOrUserId: string) {
    const profile = await this.usersService.getProfileByIdOrUserId(profileIdOrUserId);
    const profileRecord = profile as unknown as Record<string, unknown>;
    const targetUserId = String(profileRecord.userId || '');
    const viewerId = await this.resolveUserId(viewerUserId);

    await this.syncNeo4jUser(viewerId);
    if (targetUserId) {
      await this.syncNeo4jUser(targetUserId, profileRecord);
      if (targetUserId !== viewerId) {
        await this.neo4jService.recordProfileView(viewerId, targetUserId);
      }
    }

    const relationship = await this.getRelationshipForProfile(viewerUserId, profileIdOrUserId);
    const rel = relationship as {
      interestStatus: string;
      matchId: string | null;
      partnerUserId: string;
    };

    if (targetUserId === viewerId || profileIdOrUserId === viewerId) {
      return {
        profile: profileRecord,
        visibility: 'full' as const,
        relationship: { ...rel, interestStatus: 'none' },
      };
    }

    const isComplete = Boolean(profileRecord.isComplete ?? profileRecord.profileCompleted);
    const hasRelationship =
      rel.interestStatus === 'accepted' ||
      rel.interestStatus === 'pending_sent' ||
      rel.interestStatus === 'pending_received';

    if (!isComplete && !hasRelationship) {
      throw new NotFoundException('Profile not found');
    }

    const accepted = rel.interestStatus === 'accepted';
    if (accepted) {
      return {
        profile: this.applyGalleryPrivacy(profileRecord, true),
        visibility: 'full' as const,
        relationship: rel,
      };
    }

    return {
      profile: this.toLimitedProfileView(profileRecord),
      visibility: 'limited' as const,
      relationship: rel,
    };
  }
}
