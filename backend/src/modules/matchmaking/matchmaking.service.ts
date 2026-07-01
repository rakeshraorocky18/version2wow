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
import { UsersService } from '../users/users.service.typeorm';
import { calculateCompatibility } from './engines/compatibility.engine';
import { buildSuggestionFilters, mergeFilters, resolveOppositeGenderFilter } from './engines/filter.engine';
import { isHoroscopeCompatible } from './engines/horoscope.engine';
import { Neo4jMatchService } from './services/neo4j-match.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchmakingService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Shortlist)
    private shortlistRepository: Repository<Shortlist>,
    private usersService: UsersService,
    private neo4jMatchService: Neo4jMatchService,
    private notificationsService: NotificationsService,
  ) {}

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
    return profile;
  }

  private async excludeUserIds(userId: string): Promise<string[]> {
    const matches = await this.matchRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
    });
    const ids = new Set<string>([userId]);
    matches.forEach((m) => {
      ids.add(m.senderId);
      ids.add(m.receiverId);
    });
    return Array.from(ids);
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
    return profiles
      .map((candidate) => {
        const candidateRecord = candidate as Record<string, unknown>;
        const compatibility = calculateCompatibility(viewerRecord, candidateRecord, { includeHoroscope });
        let score = compatibility.score;
        if (graphBoostIds.includes(candidateRecord.id as string)) score = Math.min(100, score + 8);
        return {
          ...candidateRecord,
          compatibilityScore: score,
          compatibility,
        };
      })
      .sort((a, b) => (b.compatibilityScore as number) - (a.compatibilityScore as number));
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
    let receiverProfile: Record<string, unknown>;
    try {
      receiverProfile = (await this.usersService.getProfileById(dto.receiverId)) as unknown as Record<string, unknown>;
    } catch {
      const receiver = await this.usersService.getProfile(receiverUserId);
      receiverProfile = receiver as unknown as Record<string, unknown>;
    }

    const compatibility = calculateCompatibility(viewer, receiverProfile, { includeHoroscope: true });

    const match = this.matchRepository.create({
      senderId,
      receiverId: receiverUserId,
      message: dto.message,
      status: MatchStatus.PENDING,
      compatibilityScore: compatibility.score,
    });

    const saved = await this.matchRepository.save(match);

    const senderName = [(viewer as { firstName?: string }).firstName, (viewer as { lastName?: string }).lastName]
      .filter(Boolean)
      .join(' ') || 'Someone';
    await this.notificationsService.sendMatchNotification(receiverUserId, senderName);

    return saved;
  }

  async acceptInterest(userId: string, matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, receiverId: userId },
    });

    if (!match) throw new NotFoundException('Match request not found');

    match.status = MatchStatus.ACCEPTED;
    return this.matchRepository.save(match);
  }

  async rejectInterest(userId: string, matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, receiverId: userId },
    });

    if (!match) throw new NotFoundException('Match request not found');

    match.status = MatchStatus.REJECTED;
    return this.matchRepository.save(match);
  }

  async getReceivedInterests(userId: string) {
    await this.cleanupStaleInterestRecords(userId);
    const matches = await this.matchRepository.find({
      where: { receiverId: userId, status: MatchStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches, userId);
  }

  async getSentInterests(userId: string) {
    await this.cleanupStaleInterestRecords(userId);
    const matches = await this.matchRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches, userId);
  }

  async getAcceptedMatches(userId: string) {
    await this.cleanupStaleInterestRecords(userId);
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

      return {
        ...match,
        senderProfile,
        receiverProfile,
        partnerProfile: forUserId ? partnerProfile : null,
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

    let scored = this.scoreProfiles(viewer, result.profiles, query.includeHoroscope !== false);
    scored = this.applyHoroscopeMatchFilter(viewer, scored as Record<string, unknown>[], query);

    return { profiles: scored, total: scored.length, page, limit };
  }

  async getSuggestedMatches(userId: string, query: ProfileSearchQueryDto = {}, userRole?: string) {
    const viewer = await this.usersService.getProfileOrNull(userId);
    if (!viewer) {
      return this.searchMatches(userId, query, userRole);
    }
    const excludeUserIds = await this.excludeUserIds(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;

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

    const graphBoostIds = await this.neo4jMatchService.getGraphBoostProfileIds(userId, limit);
    let scored = this.scoreProfiles(
      viewer,
      result.profiles,
      query.includeHoroscope !== false,
      graphBoostIds,
    );
    scored = this.applyHoroscopeMatchFilter(viewer, scored as Record<string, unknown>[], query).slice(0, limit);

    return {
      profiles: scored,
      total: scored.length,
      page,
      limit,
      recommendationEngine: this.neo4jMatchService.isEnabled() ? 'graph+rules' : 'rules',
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

    const existing = await this.shortlistRepository.findOne({ where: { userId, profileId } });
    if (existing) return existing;

    const entry = this.shortlistRepository.create({ userId, profileId });
    return this.shortlistRepository.save(entry);
  }

  async removeFromShortlist(userId: string, profileId: string) {
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

    const eligible = profiles.filter(Boolean).filter(
      (p) => !oppositeGender || (p as { gender?: string }).gender === oppositeGender,
    ) as object[];

    const scored = this.scoreProfiles(viewer, eligible, true);

    return { profiles: scored, total: scored.length };
  }

  async isShortlisted(userId: string, profileIds: string[]) {
    if (!profileIds.length) return {};
    const rows = await this.shortlistRepository.find({
      where: { userId, profileId: In(profileIds) },
    });
    return Object.fromEntries(profileIds.map((id) => [id, rows.some((r) => r.profileId === id)]));
  }
}
