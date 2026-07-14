import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { paginate } from '../../../common/utils/pagination';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AgentDocumentEntity } from '../common/entities/agent-document.entity';
import { AgentActivityAction, AgentCustomerStatus } from '../common/enums/agent.enums';
import { calculateProfileCompletion } from '../common/utils/profile-completion.util';
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

    return saved;
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
      // default: newest first by createdAt
      qb.orderBy('c.createdAt', sortOrder);
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = rows.map((c) => ({
      ...c,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ').trim(),
      agentId: c.assignedAgentId,
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
    return { ...customer, documents };
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

    return saved;
  }

  async refreshCompletion(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) return;
    const documentCount = await this.documentRepo.count({ where: { customerId } });
    customer.profileCompletion = calculateProfileCompletion(customer, documentCount);
    await this.customerRepo.save(customer);
  }
}
