import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  POSTGRES_CONNECTION,
  SQLITE_CONNECTION,
} from '../../../config/database.constants';
import { paginate } from '../../../common/utils/pagination';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AgentDocumentEntity } from '../common/entities/agent-document.entity';
import {
  AgentCustomerMatchEntity,
  AgentCustomerMatchStatus,
} from '../common/entities/agent-customer-match.entity';
import { NotificationDeliveryLogEntity } from '../../notifications/entities/notification-delivery-log.entity';
import { Match } from '../../matchmaking/entities/match.entity';
import { MatchStatus } from '../../../common/enums';
import { Neo4jService } from '../../../neo4j/neo4j.service';
import { ChatServiceMongodb } from '../../chat/chat.service.mongodb';
import { NotificationsService } from '../../notifications/notifications.service';
import { SendMessageDto } from '../../chat/dto/chat.dto';
import {
  AgentActivityAction,
  AgentCustomerStatus,
  AgentDocumentType,
} from '../common/enums/agent.enums';
import {
  calculateProfileCompletion,
  getMatchmakingCompletionThreshold,
  isMatchmakingUnlocked,
} from '../common/utils/profile-completion.util';
import { resolveProfileImageUrl } from '../common/utils/profile-image.util';
import { AgentActivityService } from '../activity-log/activity-log.service';
import {
  CreateAgentCustomerDto,
  ListCustomersQueryDto,
  UpdateAgentCustomerDto,
} from './dto/customer.dto';
import { MatchingSearchDto } from './dto/matching.dto';
import {
  CustomerChatQueryDto,
  CustomerNotificationQueryDto,
} from './dto/customer-workspace.dto';
import { computeCompatibility } from './compatibility.engine';
import {
  asRecord,
  includesLoose,
  locationField,
  oppositeGender,
  parseAge,
  parseHeightCm,
  str,
  toMatchProfile,
} from './matching.helpers';

@Injectable()
export class AgentCustomersService {
  constructor(
    @InjectRepository(AgentCustomerEntity, POSTGRES_CONNECTION)
    private readonly customerRepo: Repository<AgentCustomerEntity>,
    @InjectRepository(AgentDocumentEntity, POSTGRES_CONNECTION)
    private readonly documentRepo: Repository<AgentDocumentEntity>,
    @InjectRepository(AgentCustomerMatchEntity, POSTGRES_CONNECTION)
    private readonly customerMatchRepo: Repository<AgentCustomerMatchEntity>,
    @InjectRepository(NotificationDeliveryLogEntity, POSTGRES_CONNECTION)
    private readonly notificationRepo: Repository<NotificationDeliveryLogEntity>,
    @InjectRepository(Match, SQLITE_CONNECTION)
    private readonly matchRepo: Repository<Match>,
    private readonly activityService: AgentActivityService,
    private readonly neo4jService: Neo4jService,
    private readonly chatService: ChatServiceMongodb,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async generateCustomerCode(): Promise<string> {
    const count = await this.customerRepo.count();
    return `WOW-${String(count + 1).padStart(5, '0')}`;
  }

  private async getProfileImageMap(
    customerIds: string[],
  ): Promise<Map<string, string | null>> {
    const map = new Map<string, string | null>();
    if (!customerIds.length) return map;

    const docs = await this.documentRepo.find({
      where: {
        customerId: In(customerIds),
        type: In([
          AgentDocumentType.PROFILE_PHOTO,
          AgentDocumentType.CUSTOMER_PHOTO,
        ]),
      },
      order: { createdAt: 'ASC' },
    });

    const byCustomer = new Map<string, AgentDocumentEntity[]>();
    for (const doc of docs) {
      const list = byCustomer.get(doc.customerId) || [];
      list.push(doc);
      byCustomer.set(doc.customerId, list);
    }

    for (const id of customerIds) {
      map.set(id, resolveProfileImageUrl(byCustomer.get(id) || []));
    }
    return map;
  }

  async create(agentId: string, dto: CreateAgentCustomerDto) {
    const customerCode = await this.generateCustomerCode();
    const customer = this.customerRepo.create({
      ...dto,
      customerCode,
      assignedAgentId: agentId,
      createdByAgentId: agentId,
      status: dto.status ?? AgentCustomerStatus.PENDING,
      profileCompletion: 0,
    });
    customer.profileCompletion = calculateProfileCompletion(customer, 0);
    const saved = await this.customerRepo.save(customer);

    await this.activityService.log({
      agentId,
      customerId: saved.id,
      action: AgentActivityAction.CUSTOMER_CREATED,
      description: `Customer ${saved.firstName} ${saved.lastName ?? ''} (${saved.customerCode}) created`,
    });

    return { ...saved, profileImageUrl: null };
  }

  async list(agentId: string, query: ListCustomersQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);

    const qb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.assignedAgentId = :agentId', { agentId });

    if (query.search?.trim()) {
      qb.andWhere(
        `(LOWER(c.firstName) LIKE :q OR LOWER(COALESCE(c.lastName, '')) LIKE :q OR LOWER(COALESCE(c.email, '')) LIKE :q OR COALESCE(c.phone, '') LIKE :q OR LOWER(c.customerCode) LIKE :q)`,
        { q: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    const sortBy = query.sortBy ?? 'date';
    const sortOrder = (query.sortOrder ?? 'DESC') as 'ASC' | 'DESC';
    if (sortBy === 'name') {
      qb.orderBy('c.firstName', sortOrder).addOrderBy('c.lastName', sortOrder);
    } else if (sortBy === 'completion') {
      qb.orderBy('c.profileCompletion', sortOrder);
    } else {
      qb.orderBy('c.createdAt', sortOrder);
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const imageMap = await this.getProfileImageMap(rows.map((c) => c.id));

    const data = rows.map((c) => ({
      ...c,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ').trim(),
      agentId: c.assignedAgentId,
      profileImageUrl: imageMap.get(c.id) ?? null,
    }));

    return paginate(data, total, page, limit);
  }

  async findAssignedOrFail(agentId: string, customerId: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (customer.assignedAgentId !== agentId) {
      throw new ForbiddenException('Customer is not assigned to you');
    }
    return customer;
  }

  async getOne(agentId: string, customerId: string) {
    const customer = await this.findAssignedOrFail(agentId, customerId);
    const documents = await this.documentRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
    const threshold = getMatchmakingCompletionThreshold();
    return {
      ...customer,
      documents,
      matchCompletionThreshold: threshold,
      matchmakingUnlocked: isMatchmakingUnlocked(customer.profileCompletion ?? 0),
      profileImageUrl: resolveProfileImageUrl(documents),
    };
  }

  private async recomputeCompletion(customer: AgentCustomerEntity) {
    const documentCount = await this.documentRepo.count({
      where: { customerId: customer.id },
    });
    const photoCount = await this.documentRepo.count({
      where: { customerId: customer.id, type: AgentDocumentType.CUSTOMER_PHOTO },
    });
    customer.profileCompletion = calculateProfileCompletion(
      customer,
      documentCount,
      photoCount > 0,
    );
    return customer;
  }

  async update(agentId: string, customerId: string, dto: UpdateAgentCustomerDto) {
    const customer = await this.findAssignedOrFail(agentId, customerId);
    Object.assign(customer, dto);
    await this.recomputeCompletion(customer);

    const saved = await this.customerRepo.save(customer);

    await this.activityService.log({
      agentId,
      customerId: saved.id,
      action: AgentActivityAction.CUSTOMER_UPDATED,
      description: `Customer ${saved.customerCode} profile updated`,
    });

    const imageMap = await this.getProfileImageMap([saved.id]);
    return {
      ...saved,
      profileImageUrl: imageMap.get(saved.id) ?? null,
    };
  }

  async refreshCompletion(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) return;
    await this.recomputeCompletion(customer);
    await this.customerRepo.save(customer);
  }

  /**
   * Load match candidates from ALL agents' customers (platform-wide pool),
   * excluding the selected customer. Still opposite-gender by default.
   */
  private async loadCandidatePool(_agentId: string, customerId: string, gender?: string | null) {
    const targetGender = oppositeGender(gender);
    const qb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.id <> :customerId', { customerId });

    // Prefer active/pending profiles; skip inactive when possible
    qb.andWhere('c.status IN (:...statuses)', {
      statuses: [AgentCustomerStatus.ACTIVE, AgentCustomerStatus.PENDING],
    });

    if (targetGender) {
      qb.andWhere(
        `(LOWER(TRIM(COALESCE(c.gender, ''))) = :targetGender OR LOWER(TRIM(COALESCE(c.gender, ''))) = :shortGender)`,
        { targetGender, shortGender: targetGender.charAt(0) },
      );
    }

    const candidates = await qb.getMany();
    const docs = await this.documentRepo
      .createQueryBuilder('d')
      .where('d.customerId IN (:...ids)', {
        ids: candidates.length
          ? candidates.map((c) => c.id)
          : ['00000000-0000-0000-0000-000000000000'],
      })
      .orderBy('d.createdAt', 'DESC')
      .getMany();

    const docsByCustomer = new Map<string, AgentDocumentEntity[]>();
    for (const doc of docs) {
      const list = docsByCustomer.get(doc.customerId) || [];
      list.push(doc);
      docsByCustomer.set(doc.customerId, list);
    }

    return { candidates, docsByCustomer };
  }

  private async getHiddenCandidateIds(customerId: string, candidateIds: string[]) {
    if (!candidateIds.length) return new Set<string>();

    const hiddenStatuses = [
      AgentCustomerMatchStatus.ACCEPTED,
      AgentCustomerMatchStatus.PENDING_SENT,
      AgentCustomerMatchStatus.PENDING_RECEIVED,
      AgentCustomerMatchStatus.BLOCKED,
      AgentCustomerMatchStatus.IGNORED,
      AgentCustomerMatchStatus.DECLINED,
      AgentCustomerMatchStatus.WITHDRAWN,
    ];

    const relationships = await this.customerMatchRepo.find({
      where: [
        { customerId, profileId: In(candidateIds) },
        { customerId: In(candidateIds), profileId: customerId },
      ],
    });

    const hiddenProfileIds = new Set<string>();
    for (const relationship of relationships) {
      if (!hiddenStatuses.includes(relationship.status)) continue;
      if (relationship.customerId === customerId) {
        hiddenProfileIds.add(relationship.profileId);
      } else if (relationship.profileId === customerId) {
        hiddenProfileIds.add(relationship.customerId);
      }
    }

    return hiddenProfileIds;
  }

  async searchMatches(agentId: string, customerId: string, dto: MatchingSearchDto) {
    const customer = await this.findAssignedOrFail(agentId, customerId);
    const page = Number(dto.page) || 1;
    const limit = Math.min(Number(dto.limit) || 12, 50);
    const { candidates, docsByCustomer } = await this.loadCandidatePool(
      agentId,
      customerId,
      customer.gender,
    );

    const minHeight = parseHeightCm(dto.minHeight);
    const maxHeight = parseHeightCm(dto.maxHeight);

    let profiles = candidates
      .map((candidate) => {
        const personal = asRecord(candidate.personalDetails);
        const family = asRecord(candidate.familyDetails);
        const education = asRecord(candidate.educationDetails);
        const religion = asRecord(candidate.religionDetails);
        const age = parseAge(candidate.dateOfBirth);
        const heightCm = parseHeightCm(personal.height);
        const customerDocs = docsByCustomer.get(candidate.id) || [];
        const photo =
          customerDocs.find((d) => d.type === AgentDocumentType.CUSTOMER_PHOTO)
            ?.fileUrl ||
          customerDocs[0]?.fileUrl ||
          null;

        if (dto.search?.trim()) {
          const q = dto.search.toLowerCase();
          const hay = [
            candidate.firstName,
            candidate.lastName,
            candidate.customerCode,
            candidate.phone,
          ]
            .map((v) => str(v).toLowerCase())
            .join(' ');
          if (!hay.includes(q)) return null;
        }

        if (dto.religion && !includesLoose(candidate.religion, dto.religion)) return null;
        if (dto.caste && !includesLoose(candidate.caste, dto.caste)) return null;
        if (dto.motherTongue && !includesLoose(candidate.motherTongue, dto.motherTongue)) {
          return null;
        }
        if (dto.education && !includesLoose(candidate.education, dto.education)) return null;
        if (dto.occupation && !includesLoose(candidate.occupation, dto.occupation)) {
          return null;
        }
        if (dto.minAge != null && (age == null || age < dto.minAge)) return null;
        if (dto.maxAge != null && (age == null || age > dto.maxAge)) return null;
        if (minHeight != null && (heightCm == null || heightCm < minHeight)) return null;
        if (maxHeight != null && (heightCm == null || heightCm > maxHeight)) return null;
        if (dto.subCaste && !includesLoose(personal.subCaste || religion.subCaste, dto.subCaste)) {
          return null;
        }
        if (dto.maritalStatus && !includesLoose(personal.maritalStatus, dto.maritalStatus)) {
          return null;
        }
        if (dto.annualIncome && !includesLoose(education.annualIncome, dto.annualIncome)) {
          return null;
        }
        if (dto.country && !includesLoose(locationField(personal, 'country'), dto.country)) {
          return null;
        }
        if (dto.state && !includesLoose(locationField(personal, 'state'), dto.state)) {
          return null;
        }
        if (dto.city && !includesLoose(locationField(personal, 'city'), dto.city)) {
          return null;
        }
        if (dto.familyType && !includesLoose(family.familyType, dto.familyType)) return null;
        if (dto.familyStatus && !includesLoose(family.familyStatus, dto.familyStatus)) {
          return null;
        }
        if (
          dto.foodPreference &&
          !includesLoose(personal.foodPreference || personal.diet, dto.foodPreference)
        ) {
          return null;
        }
        if (dto.smoking && !includesLoose(personal.smoking, dto.smoking)) return null;
        if (dto.drinking && !includesLoose(personal.drinking, dto.drinking)) return null;
        if (
          dto.horoscope &&
          !includesLoose(religion.rasi || personal.rasi || personal.star, dto.horoscope)
        ) {
          return null;
        }
        if (
          dto.manglik &&
          !includesLoose(
            religion.kujaDosham || personal.manglik || personal.kujaDosham,
            dto.manglik,
          )
        ) {
          return null;
        }
        if (
          dto.minProfileCompletion != null &&
          (candidate.profileCompletion ?? 0) < dto.minProfileCompletion
        ) {
          return null;
        }

        const compatibility = computeCompatibility(
          candidate,
          customer,
          customerDocs.length,
        );
        const profile = toMatchProfile(
          candidate,
          photo,
          customerDocs.length,
          compatibility,
        );

        if (dto.verifiedOnly && !profile.isVerified) return null;
        if (dto.premiumOnly && !profile.isPremium) return null;
        if (dto.recentlyActive && !profile.recentlyActive) return null;

        return profile;
      })
      .filter((p): p is NonNullable<typeof p> => p != null);

    const hiddenProfileIds = await this.getHiddenCandidateIds(customerId, profiles.map((profile) => profile.id));
    profiles = profiles.filter((profile) => profile.id !== customer.id && !hiddenProfileIds.has(profile.id));

    const sortBy = dto.sortBy || 'compatibility';
    profiles.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'recently_active') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'completion') {
        return b.profileCompletion - a.profileCompletion;
      }
      return b.compatibilityScore - a.compatibilityScore;
    });

    const total = profiles.length;
    const start = (page - 1) * limit;
    const data = profiles.slice(start, start + limit);

    return {
      ...paginate(data, total, page, limit),
      customerId,
      customerName: [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim(),
    };
  }

  /**
   * Full profile for a matched candidate from the platform-wide pool.
   * Viewer customer must belong to the requesting agent.
   */
  async getMatchProfile(
    agentId: string,
    customerId: string,
    matchedProfileId: string,
  ) {
    const viewer = await this.findAssignedOrFail(agentId, customerId);
    if (matchedProfileId === customerId) {
      throw new NotFoundException('Matched profile not found');
    }

    const candidate = await this.customerRepo.findOne({
      where: { id: matchedProfileId },
    });
    if (!candidate) {
      throw new NotFoundException('Matched profile not found');
    }

    const documents = await this.documentRepo.find({
      where: { customerId: matchedProfileId },
      order: { createdAt: 'DESC' },
    });
    const photo = resolveProfileImageUrl(documents);
    const compatibility = computeCompatibility(candidate, viewer, documents.length);
    const profile = toMatchProfile(candidate, photo, documents.length, compatibility);
    const relationships = await this.customerMatchRepo.find({
      where: [
        { customerId, profileId: matchedProfileId },
        { customerId: matchedProfileId, profileId: customerId },
      ],
    });
    const relationship =
      relationships.find((row) => row.status === AgentCustomerMatchStatus.ACCEPTED) ||
      relationships.find((row) => row.customerId === customerId) ||
      relationships[0];
    const viewerRelationship =
      relationship?.customerId === customerId
        ? relationship
        : relationships.find((row) => row.customerId === customerId);

    return {
      viewerCustomerId: customerId,
      viewerCustomerName: [viewer.firstName, viewer.lastName]
        .filter(Boolean)
        .join(' ')
        .trim(),
      profile: {
        ...profile,
        personalDetails: candidate.personalDetails || {},
        familyDetails: candidate.familyDetails || {},
        educationDetails: candidate.educationDetails || {},
        religionDetails: candidate.religionDetails || {},
        partnerPreferences: candidate.partnerPreferences || {},
        email: candidate.email ?? '',
        address: candidate.address ?? '',
        motherTongue: candidate.motherTongue ?? '',
        dateOfBirth: candidate.dateOfBirth ?? null,
        relationshipId: relationship?.id ?? null,
        relationshipStatus: relationship?.status ?? 'none',
        favourite: viewerRelationship?.favourite ?? false,
        shortlisted: viewerRelationship?.shortlisted ?? false,
        blocked: relationship?.blocked ?? false,
        ignored: relationship?.ignored ?? false,
        accepted: relationship?.status === AgentCustomerMatchStatus.ACCEPTED,
      },
      documents: documents.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        createdAt: d.createdAt,
      })),
    };
  }

  async getRecommendations(agentId: string, customerId: string) {
    const customer = await this.findAssignedOrFail(agentId, customerId);
    const { candidates, docsByCustomer } = await this.loadCandidatePool(
      agentId,
      customerId,
      customer.gender,
    );

    const hiddenProfileIds = await this.getHiddenCandidateIds(
      customerId,
      candidates.map((candidate) => candidate.id),
    );

    const profiles = candidates
      .filter((candidate) => candidate.id !== customer.id && !hiddenProfileIds.has(candidate.id))
      .map((candidate) => {
        const customerDocs = docsByCustomer.get(candidate.id) || [];
        const photo =
          customerDocs.find((d) => d.type === AgentDocumentType.CUSTOMER_PHOTO)
            ?.fileUrl ||
          customerDocs[0]?.fileUrl ||
          null;
        const compatibility = computeCompatibility(
          candidate,
          customer,
          customerDocs.length,
        );
        return toMatchProfile(candidate, photo, customerDocs.length, compatibility);
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5)
      .map((profile, index) => ({
        ...profile,
        isBestMatch: index === 0,
        isTopRecommendation: index < 3,
      }));

    return {
      customerId,
      customerName: [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim(),
      data: profiles,
      total: profiles.length,
    };
  }

  private async findCandidateOrFail(profileId: string) {
    const candidate = await this.customerRepo.findOne({ where: { id: profileId } });
    if (!candidate) throw new NotFoundException('Match profile not found');
    return candidate;
  }

  private relationshipKey(customerId: string, profileId: string) {
    return { customerId, profileId };
  }

  private async getOrCreateRelationship(params: {
    agentId: string;
    customerId: string;
    profileId: string;
    compatibilityScore?: number | null;
  }) {
    let row = await this.customerMatchRepo.findOne({
      where: this.relationshipKey(params.customerId, params.profileId),
    });
    if (row) return row;

    row = this.customerMatchRepo.create({
      agentId: params.agentId,
      customerId: params.customerId,
      profileId: params.profileId,
      status: AgentCustomerMatchStatus.RECOMMENDED,
      compatibilityScore: params.compatibilityScore ?? null,
      lastActionAt: new Date(),
    });
    return this.customerMatchRepo.save(row);
  }

  private async ensureSqliteMatch(
    senderId: string,
    receiverId: string,
    status: MatchStatus,
    compatibilityScore?: number | null,
    message?: string,
  ) {
    const rows = await this.matchRepo.find({
      where: [{ senderId }, { receiverId: senderId }],
    });
    let match =
      rows.find(
        (row) =>
          (row.senderId === senderId && row.receiverId === receiverId) ||
          (row.senderId === receiverId && row.receiverId === senderId),
      ) || null;

    if (!match) {
      match = this.matchRepo.create({
        senderId,
        receiverId,
        status,
        compatibilityScore: compatibilityScore ?? undefined,
        message,
      });
    } else {
      match.senderId = senderId;
      match.receiverId = receiverId;
      match.status = status;
      match.compatibilityScore = compatibilityScore ?? match.compatibilityScore;
      if (message) match.message = message;
    }

    return this.matchRepo.save(match);
  }

  private async notifyCustomer(
    customerId: string,
    title: string,
    body: string,
    type: 'match' | 'message' | 'booking' | 'reminder' | 'system' = 'match',
    data?: Record<string, unknown>,
  ) {
    await this.notificationsService.sendNotification({
      userId: customerId,
      title,
      body,
      type,
      data: { customerId, ...(data || {}) },
    });
  }

  private async overlayRelationships(customerId: string, profiles: Array<Record<string, unknown>>) {
    if (!profiles.length) return profiles;
    const rows = await this.customerMatchRepo.find({
      where: { customerId },
    });
    const byProfile = new Map(rows.map((row) => [row.profileId, row]));
    return profiles.map((profile) => {
      const rel = byProfile.get(String(profile.id));
      return {
        ...profile,
        relationshipId: rel?.id ?? null,
        relationshipStatus: rel?.status ?? 'none',
        favourite: rel?.favourite ?? false,
        shortlisted: rel?.shortlisted ?? false,
        blocked: rel?.blocked ?? false,
        ignored: rel?.ignored ?? false,
        notesCount: rel?.notes?.length ?? 0,
        accepted: rel?.status === AgentCustomerMatchStatus.ACCEPTED,
      };
    });
  }

  async getWorkspace(agentId: string, customerId: string) {
    const customer = await this.getOne(agentId, customerId);
    const rows = await this.customerMatchRepo.find({ where: { customerId } });
    const matchCount = rows.filter(
      (row) =>
        row.status !== AgentCustomerMatchStatus.BLOCKED &&
        row.status !== AgentCustomerMatchStatus.IGNORED,
    ).length;
    const pendingRequests = rows.filter(
      (row) =>
        row.status === AgentCustomerMatchStatus.PENDING_RECEIVED ||
        row.status === AgentCustomerMatchStatus.PENDING_SENT,
    ).length;
    const acceptedMatches = rows.filter(
      (row) => row.status === AgentCustomerMatchStatus.ACCEPTED,
    ).length;

    return {
      customer,
      stats: {
        matchCount,
        pendingRequests,
        acceptedMatches,
      },
    };
  }

  async getCustomerMatches(
    agentId: string,
    customerId: string,
    query: MatchingSearchDto,
  ) {
    const result = await this.searchMatches(agentId, customerId, query);
    return {
      ...result,
      data: await this.overlayRelationships(
        customerId,
        result.data as unknown as Array<Record<string, unknown>>,
      ),
    };
  }

  async sendInterest(agentId: string, customerId: string, profileId: string) {
    const customer = await this.findAssignedOrFail(agentId, customerId);
    const profile = await this.findCandidateOrFail(profileId);
    if (customer.id === profile.id) throw new BadRequestException('Cannot send interest to same customer');

    const compatibility = computeCompatibility(profile, customer, 0);
    const relationship = await this.getOrCreateRelationship({
      agentId,
      customerId,
      profileId,
      compatibilityScore: compatibility.score,
    });

    if (
      relationship.status === AgentCustomerMatchStatus.PENDING_SENT ||
      relationship.status === AgentCustomerMatchStatus.PENDING_RECEIVED ||
      relationship.status === AgentCustomerMatchStatus.ACCEPTED
    ) {
      return relationship;
    }

    relationship.status = AgentCustomerMatchStatus.PENDING_SENT;
    relationship.compatibilityScore = compatibility.score;
    relationship.shortlisted = false;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);

    const reverse = await this.getOrCreateRelationship({
      agentId: profile.assignedAgentId,
      customerId: profileId,
      profileId: customerId,
      compatibilityScore: compatibility.score,
    });
    reverse.status = AgentCustomerMatchStatus.PENDING_RECEIVED;
    reverse.compatibilityScore = compatibility.score;
    reverse.shortlisted = false;
    reverse.lastActionAt = new Date();
    await this.customerMatchRepo.save(reverse);

    const sqliteMatch = await this.ensureSqliteMatch(
      customerId,
      profileId,
      MatchStatus.PENDING,
      compatibility.score,
    );
    if (this.neo4jService.isEnabled()) {
      await this.neo4jService.upsertUserNode({ id: customerId, gender: customer.gender, profileCompleted: true });
      await this.neo4jService.upsertUserNode({ id: profileId, gender: profile.gender, profileCompleted: true });
      await this.neo4jService.sendInterest({
        matchId: sqliteMatch.id,
        senderId: customerId,
        receiverId: profileId,
        compatibilityScore: compatibility.score,
      });
    }

    await this.notifyCustomer(profileId, 'Interest Request Received', `${customer.firstName} sent an interest request.`, 'match', {
      profileId: customerId,
      matchId: saved.id,
    });
    return saved;
  }

  async acceptInterest(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const profile = await this.findCandidateOrFail(profileId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.status = AgentCustomerMatchStatus.ACCEPTED;
    relationship.blocked = false;
    relationship.ignored = false;
    relationship.shortlisted = false;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);

    const reverse = await this.getOrCreateRelationship({
      agentId: profile.assignedAgentId,
      customerId: profileId,
      profileId: customerId,
    });
    reverse.status = AgentCustomerMatchStatus.ACCEPTED;
    reverse.blocked = false;
    reverse.ignored = false;
    reverse.shortlisted = false;
    reverse.lastActionAt = new Date();
    await this.customerMatchRepo.save(reverse);

    const sqliteMatch = await this.ensureSqliteMatch(
      profileId,
      customerId,
      MatchStatus.ACCEPTED,
      relationship.compatibilityScore,
    );
    if (this.neo4jService.isEnabled()) {
      await this.neo4jService.upsertUserNode({ id: customerId, profileCompleted: true });
      await this.neo4jService.upsertUserNode({ id: profileId, profileCompleted: true });
      await this.neo4jService.acceptInterest(sqliteMatch.id, customerId);
    }

    await this.notifyCustomer(profileId, 'Interest Accepted', 'Your interest request was accepted.', 'match', {
      profileId: customerId,
      matchId: saved.id,
    });
    return saved;
  }

  async declineInterest(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.status = AgentCustomerMatchStatus.DECLINED;
    relationship.shortlisted = false;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);
    await this.ensureSqliteMatch(profileId, customerId, MatchStatus.REJECTED, relationship.compatibilityScore);
    await this.notifyCustomer(profileId, 'Interest Declined', 'Your interest request was declined.', 'match', {
      profileId: customerId,
      matchId: saved.id,
    });
    return saved;
  }

  async withdrawInterest(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.status = AgentCustomerMatchStatus.WITHDRAWN;
    relationship.shortlisted = false;
    relationship.lastActionAt = new Date();
    return this.customerMatchRepo.save(relationship);
  }

  async toggleFavourite(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    await this.findCandidateOrFail(profileId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.favourite = !relationship.favourite;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);
    await this.notifyCustomer(customerId, relationship.favourite ? 'Favourite Added' : 'Favourite Removed', 'Favourite profile list updated.', 'system', {
      profileId,
    });
    return saved;
  }

  async toggleShortlist(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    await this.findCandidateOrFail(profileId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.shortlisted = !relationship.shortlisted;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);
    if (this.neo4jService.isEnabled()) {
      if (relationship.shortlisted) {
        await this.neo4jService.shortlistUser(customerId, profileId, profileId);
      } else {
        await this.neo4jService.removeShortlist(customerId, profileId);
      }
    }
    await this.notifyCustomer(customerId, relationship.shortlisted ? 'Profile Shortlisted' : 'Shortlist Removed', 'Shortlisted profile list updated.', 'system', {
      profileId,
    });
    return saved;
  }

  async blockProfile(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.status = AgentCustomerMatchStatus.BLOCKED;
    relationship.blocked = true;
    relationship.shortlisted = false;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);
    await this.ensureSqliteMatch(customerId, profileId, MatchStatus.BLOCKED, relationship.compatibilityScore);
    if (this.neo4jService.isEnabled()) await this.neo4jService.blockUser(customerId, profileId, saved.id);
    return saved;
  }

  async unblockProfile(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.status = AgentCustomerMatchStatus.RECOMMENDED;
    relationship.blocked = false;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);
    if (this.neo4jService.isEnabled()) await this.neo4jService.unblockUser(customerId, profileId);
    return saved;
  }

  async ignoreProfile(agentId: string, customerId: string, profileId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    relationship.status = AgentCustomerMatchStatus.IGNORED;
    relationship.ignored = true;
    relationship.lastActionAt = new Date();
    const saved = await this.customerMatchRepo.save(relationship);
    if (this.neo4jService.isEnabled()) await this.neo4jService.ignoreUser(customerId, profileId);
    return saved;
  }

  async addProfileNote(agentId: string, customerId: string, profileId: string, content: string) {
    await this.findAssignedOrFail(agentId, customerId);
    await this.findCandidateOrFail(profileId);
    const relationship = await this.getOrCreateRelationship({ agentId, customerId, profileId });
    const now = new Date().toISOString();
    relationship.notes = [
      ...(relationship.notes || []),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content,
        createdAt: now,
      },
    ];
    relationship.lastActionAt = new Date();
    return this.customerMatchRepo.save(relationship);
  }

  async getHistory(agentId: string, customerId: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const rows = await this.customerMatchRepo.find({
      where: { customerId },
      order: { updatedAt: 'DESC' },
    });
    const profileIds = [...new Set(rows.map((row) => row.profileId))];
    const profiles = profileIds.length
      ? await this.customerRepo.find({ where: { id: In(profileIds) } })
      : [];
    const imageMap = await this.getProfileImageMap(profileIds);
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));

    const toCard = (row: AgentCustomerMatchEntity) => {
      const profile = byId.get(row.profileId);
      if (!profile) return null;
      return {
        relationship: row,
        profile: {
          ...profile,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim(),
          profileImageUrl: imageMap.get(profile.id) ?? null,
        },
      };
    };

    const cards = rows.map(toCard).filter(Boolean);
    return {
      friends: cards.filter((card) => card!.relationship.status === AgentCustomerMatchStatus.ACCEPTED),
      requestsReceived: cards.filter((card) => card!.relationship.status === AgentCustomerMatchStatus.PENDING_RECEIVED),
      requestsSent: cards.filter((card) => card!.relationship.status === AgentCustomerMatchStatus.PENDING_SENT),
      shortlisted: cards.filter((card) =>
        card!.relationship.shortlisted &&
        card!.relationship.status === AgentCustomerMatchStatus.RECOMMENDED,
      ),
      blocked: cards.filter((card) => card!.relationship.blocked || card!.relationship.status === AgentCustomerMatchStatus.BLOCKED),
      declined: cards.filter((card) =>
        [AgentCustomerMatchStatus.DECLINED, AgentCustomerMatchStatus.WITHDRAWN, AgentCustomerMatchStatus.IGNORED].includes(
          card!.relationship.status,
        ),
      ),
    };
  }

  async getNotifications(
    agentId: string,
    customerId: string,
    query: CustomerNotificationQueryDto,
  ) {
    await this.findAssignedOrFail(agentId, customerId);
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const [rows, total] = await this.notificationRepo.findAndCount({
      where: { userId: customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(rows, total, page, limit);
  }

  async markNotificationsRead(agentId: string, customerId: string, notificationId?: string) {
    await this.findAssignedOrFail(agentId, customerId);
    const where = notificationId ? { id: notificationId, userId: customerId } : { userId: customerId };
    await this.notificationRepo.update(where, { status: 'read' });
    return { success: true };
  }

  async getChat(agentId: string, customerId: string, query: CustomerChatQueryDto) {
    await this.findAssignedOrFail(agentId, customerId);
    const accepted = await this.customerMatchRepo.find({
      where: { customerId, status: AgentCustomerMatchStatus.ACCEPTED },
      order: { updatedAt: 'DESC' },
    });
    const contacts = await Promise.all(
      accepted.map(async (row) => {
        const profile = await this.findCandidateOrFail(row.profileId);
        const unread = await this.chatService.getUnreadCount(customerId);
        return {
          userId: row.profileId,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim(),
          subtitle: 'Accepted match',
          onlineStatus: Date.now() - new Date(profile.updatedAt).getTime() < 24 * 60 * 60 * 1000,
          unreadCount: unread,
        };
      }),
    );

    const activeProfileId = query.profileId || contacts[0]?.userId;
    const messages = activeProfileId
      ? await this.chatService.getMessages(customerId, activeProfileId, query.page, query.limit)
      : { messages: [], total: 0 };

    return {
      contacts,
      activeProfileId,
      messages,
    };
  }

  async sendChatMessage(
    agentId: string,
    customerId: string,
    dto: SendMessageDto,
  ) {
    await this.findAssignedOrFail(agentId, customerId);
    const relationship = await this.customerMatchRepo.findOne({
      where: {
        customerId,
        profileId: dto.receiverId,
        status: AgentCustomerMatchStatus.ACCEPTED,
      },
    });
    if (!relationship) throw new BadRequestException('Only accepted matches can chat');
    const message = await this.chatService.sendMessage(customerId, dto);
    await this.notifyCustomer(dto.receiverId, 'New Chat Message', 'You have a new message.', 'message', {
      profileId: customerId,
    });
    return message;
  }

  async attachProfileImageUrls<T extends { id: string }>(
    customers: T[],
  ): Promise<(T & { profileImageUrl: string | null })[]> {
    const imageMap = await this.getProfileImageMap(customers.map((c) => c.id));
    return customers.map((c) => ({
      ...c,
      profileImageUrl: imageMap.get(c.id) ?? null,
    }));
  }
}
