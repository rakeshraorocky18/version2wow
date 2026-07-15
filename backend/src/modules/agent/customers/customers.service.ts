import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { paginate } from '../../../common/utils/pagination';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AgentDocumentEntity } from '../common/entities/agent-document.entity';
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
    private readonly activityService: AgentActivityService,
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
    const photo =
      documents.find((d) => d.type === AgentDocumentType.CUSTOMER_PHOTO)?.fileUrl ||
      documents[0]?.fileUrl ||
      null;
    const compatibility = computeCompatibility(candidate, viewer, documents.length);
    const profile = toMatchProfile(candidate, photo, documents.length, compatibility);

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

    const profiles = candidates
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
