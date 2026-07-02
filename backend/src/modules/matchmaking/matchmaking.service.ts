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
import { applyPremiumMatchBoost, enrichWithPremiumBoost, isPremiumSubscriber } from './engines/premium.engine';
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
        score = applyPremiumMatchBoost(score, candidateRecord);
        return enrichWithPremiumBoost(
          {
            ...candidateRecord,
            compatibility,
          },
          score,
        );
      })
      .sort((a, b) => {
        const scoreDiff = (b.compatibilityScore as number) - (a.compatibilityScore as number);
        if (scoreDiff !== 0) return scoreDiff;
        return (isPremiumSubscriber(b) ? 1 : 0) - (isPremiumSubscriber(a) ? 1 : 0);
      });
  }

  async getPremiumStatus(userId: string) {
    const profile = await this.usersService.getProfileOrNull(userId);
    const isPremium = profile?.isPremium === true;
    return {
      isPremium,
      hasActiveSubscription: isPremium,
      paymentIntegrationEnabled: false,
      benefits: {
        boostedProfile: isPremium,
        priorityInMatchListings: isPremium,
      },
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
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match request not found');

    const normalizedUser = await this.resolveUserId(userId);
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
        senderProfile:
          match.status === MatchStatus.ACCEPTED
            ? senderProfile
            : senderProfile
              ? this.stripGalleryFromProfile(senderProfile as unknown as Record<string, unknown>)
              : null,
        receiverProfile:
          match.status === MatchStatus.ACCEPTED
            ? receiverProfile
            : receiverProfile
              ? this.stripGalleryFromProfile(receiverProfile as unknown as Record<string, unknown>)
              : null,
        partnerProfile: forUserId
          ? match.status === MatchStatus.ACCEPTED
            ? partnerProfile
            : partnerProfile
              ? this.stripGalleryFromProfile(partnerProfile as unknown as Record<string, unknown>)
              : null
          : null,
        partnerUserId: forUserId ? partnerUserId : null,
      };
    });
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

    const scored = this.maskProfilesForDiscovery(
      this.scoreProfiles(viewer, result.profiles, query.includeHoroscope !== false) as Record<string, unknown>[],
    );

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
    const scored = this.maskProfilesForDiscovery(
      this.scoreProfiles(
        viewer,
        result.profiles,
        query.includeHoroscope !== false,
        graphBoostIds,
      ).slice(0, limit) as Record<string, unknown>[],
    );

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

    const scored = this.maskProfilesForDiscovery(
      this.scoreProfiles(
        viewer,
        profiles.filter(Boolean) as object[],
        true,
      ) as Record<string, unknown>[],
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

  async hasAcceptedMatch(viewerUserId: string, targetUserId: string): Promise<boolean> {
    const viewer = await this.resolveUserId(viewerUserId);
    const target = await this.resolveUserId(targetUserId);
    if (viewer === target) return true;

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

  private stripGalleryFromProfile(profile: Record<string, unknown>): Record<string, unknown> {
    const wizard = (profile.wizardProfile || {}) as Record<string, unknown>;
    const mainPhoto = profile.profilePhoto || wizard.profilePhoto;
    return {
      ...profile,
      photos: [],
      galleryHidden: true,
      wizardProfile: wizard
        ? {
            ...wizard,
            profilePhoto: mainPhoto,
          }
        : { profilePhoto: mainPhoto },
    };
  }

  private applyGalleryPrivacy(
    profile: Record<string, unknown>,
    hasMatchAccess: boolean,
  ): Record<string, unknown> {
    const visibility = (profile.galleryVisibility as string) || 'matched_only';
    const canViewGallery = hasMatchAccess || visibility === 'public';
    if (canViewGallery) return profile;
    return this.stripGalleryFromProfile(profile);
  }

  private maskProfilesForDiscovery(profiles: Record<string, unknown>[]) {
    return profiles.map((profile) => this.stripGalleryFromProfile(profile));
  }

  private toLimitedProfileView(profile: Record<string, unknown>): Record<string, unknown> {
    const wizard = (profile.wizardProfile || {}) as Record<string, unknown>;
    const pd = { ...((wizard.personalDetails || {}) as Record<string, unknown>) };
    delete pd.email;
    delete pd.phone;
    delete pd.address;
    delete pd.pincode;
    const mainPhoto = profile.profilePhoto || wizard.profilePhoto;

    const base = {
      ...profile,
      email: undefined,
      phone: undefined,
      address: undefined,
      pincode: undefined,
      income: undefined,
      annualIncome: undefined,
      occupation: undefined,
      jobTitle: undefined,
      companyName: undefined,
      industry: undefined,
      experience: undefined,
      interests: undefined,
      prefAgeMin: undefined,
      prefAgeMax: undefined,
      prefHeightMin: undefined,
      prefHeightMax: undefined,
      prefMaritalStatuses: undefined,
      prefReligions: undefined,
      prefCastes: undefined,
      prefFamilyType: undefined,
      profilePhoto: mainPhoto,
      wizardProfile: {
        profilePhoto: mainPhoto,
        personalDetails: pd,
        religion: wizard.religion,
        education: wizard.education,
        expressYourself: wizard.expressYourself,
      },
    };

    return this.applyGalleryPrivacy(base, false);
  }

  async getMatchProfile(viewerUserId: string, profileIdOrUserId: string) {
    const profile = await this.usersService.getProfileByIdOrUserId(profileIdOrUserId);
    const profileRecord = profile as unknown as Record<string, unknown>;
    const targetUserId = String(profileRecord.userId || '');
    const viewerId = await this.resolveUserId(viewerUserId);

    if (targetUserId === viewerId || profileIdOrUserId === viewerId) {
      return { profile: profileRecord, visibility: 'full' as const };
    }

    const accepted = await this.hasAcceptedMatch(viewerId, targetUserId);
    if (accepted) {
      return { profile: this.applyGalleryPrivacy(profileRecord, true), visibility: 'full' as const };
    }

    return {
      profile: this.toLimitedProfileView(profileRecord),
      visibility: 'limited' as const,
    };
  }
}
