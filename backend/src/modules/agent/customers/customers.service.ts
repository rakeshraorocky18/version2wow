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
import { calculateProfileCompletion } from '../common/utils/profile-completion.util';
import { resolveProfileImageUrl } from '../common/utils/profile-image.util';
import { AgentActivityService } from '../activity-log/activity-log.service';
import {
  CreateAgentCustomerDto,
  ListCustomersQueryDto,
  UpdateAgentCustomerDto,
} from './dto/customer.dto';

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
    return {
      ...customer,
      documents,
      profileImageUrl: resolveProfileImageUrl(documents),
    };
  }

  async update(agentId: string, customerId: string, dto: UpdateAgentCustomerDto) {
    const customer = await this.findAssignedOrFail(agentId, customerId);
    Object.assign(customer, dto);

    const documentCount = await this.documentRepo.count({
      where: { customerId },
    });
    customer.profileCompletion = calculateProfileCompletion(customer, documentCount);

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
    const documentCount = await this.documentRepo.count({ where: { customerId } });
    customer.profileCompletion = calculateProfileCompletion(customer, documentCount);
    await this.customerRepo.save(customer);
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
