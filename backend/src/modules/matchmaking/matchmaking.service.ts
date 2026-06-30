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
import { buildSuggestionFilters, mergeFilters } from './engines/filter.engine';
import { Neo4jMatchService } from './services/neo4j-match.service';

@Injectable()
export class MatchmakingService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Shortlist)
    private shortlistRepository: Repository<Shortlist>,
    private usersService: UsersService,
    private neo4jMatchService: Neo4jMatchService,
  ) {}

  private async resolveReceiverUserId(receiverId: string): Promise<string> {
    try {
      const byProfile = await this.usersService.getProfileById(receiverId);
      return byProfile.userId;
    } catch {
      return receiverId;
    }
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

    const existingMatch = await this.matchRepository.findOne({
      where: [
        { senderId, receiverId: receiverUserId },
        { senderId: receiverUserId, receiverId: senderId },
      ],
    });

    if (existingMatch) {
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

    return this.matchRepository.save(match);
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
    const matches = await this.matchRepository.find({
      where: { receiverId: userId, status: MatchStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches);
  }

  async getSentInterests(userId: string) {
    const matches = await this.matchRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches);
  }

  async getAcceptedMatches(userId: string) {
    const matches = await this.matchRepository.find({
      where: [
        { senderId: userId, status: MatchStatus.ACCEPTED },
        { receiverId: userId, status: MatchStatus.ACCEPTED },
      ],
      order: { updatedAt: 'DESC' },
    });
    return this.attachProfilesToMatches(matches);
  }

  private async attachProfilesToMatches(matches: Match[]) {
    if (!matches.length) return [];

    const userIds = Array.from(
      new Set(matches.flatMap((m) => [m.senderId, m.receiverId])),
    );

    const profileRows = await Promise.all(
      userIds.map(async (uid) => {
        try {
          return await this.usersService.getProfile(uid);
        } catch {
          return null;
        }
      }),
    );

    const byUserId = new Map(
      profileRows.filter(Boolean).map((p) => [p!.userId, p]),
    );

    return matches.map((match) => ({
      ...match,
      senderProfile: byUserId.get(match.senderId) || null,
      receiverProfile: byUserId.get(match.receiverId) || null,
    }));
  }

  async searchMatches(userId: string, query: ProfileSearchQueryDto) {
    const viewer = await this.usersService.getProfileOrNull(userId);
    const excludeUserIds = await this.excludeUserIds(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;

    const result = await this.usersService.searchProfiles(
      { ...query },
      page,
      limit,
      { excludeUserIds },
    );

    const scored = this.scoreProfiles(viewer, result.profiles, query.includeHoroscope !== false);

    return { profiles: scored, total: result.total, page, limit };
  }

  async getSuggestedMatches(userId: string, query: ProfileSearchQueryDto = {}) {
    const viewer = await this.usersService.getProfileOrNull(userId);
    if (!viewer) {
      // If user hasn't created a profile yet, show searchable profiles instead of empty suggestions.
      return this.searchMatches(userId, query);
    }
    const excludeUserIds = await this.excludeUserIds(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;

    const autoFilters = buildSuggestionFilters(viewer);
    const filters = mergeFilters(autoFilters, query);

    const result = await this.usersService.searchProfiles(
      { ...filters } as Record<string, unknown>,
      page,
      limit * 2,
      { excludeUserIds },
    );

    const graphBoostIds = await this.neo4jMatchService.getGraphBoostProfileIds(userId, limit);
    const scored = this.scoreProfiles(
      viewer,
      result.profiles,
      query.includeHoroscope !== false,
      graphBoostIds,
    ).slice(0, limit);

    return {
      profiles: scored,
      total: result.total,
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

  async getShortlist(userId: string) {
    const entries = await this.shortlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!entries.length) return { profiles: [], total: 0 };

    const viewer = await this.getViewerProfile(userId);
    const profiles = await Promise.all(
      entries.map(async (e) => {
        try {
          return await this.usersService.getProfileById(e.profileId);
        } catch {
          return null;
        }
      }),
    );

    const scored = this.scoreProfiles(
      viewer,
      profiles.filter(Boolean) as object[],
      true,
    );

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
