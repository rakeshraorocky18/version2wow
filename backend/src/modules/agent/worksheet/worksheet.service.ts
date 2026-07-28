import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { paginate } from '../../../common/utils/pagination';
import { AgentWorksheetEntity } from '../common/entities/agent-worksheet.entity';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import {
  AgentActivityAction,
  WorksheetTaskStatus,
} from '../common/enums/agent.enums';
import { AgentActivityService } from '../activity-log/activity-log.service';
import {
  CreateWorksheetDto,
  ListWorksheetQueryDto,
  UpdateWorksheetDto,
} from './dto/worksheet.dto';

@Injectable()
export class AgentWorksheetService {
  constructor(
    @InjectRepository(AgentWorksheetEntity, POSTGRES_CONNECTION)
    private readonly worksheetRepo: Repository<AgentWorksheetEntity>,
    @InjectRepository(AgentCustomerEntity, POSTGRES_CONNECTION)
    private readonly customerRepo: Repository<AgentCustomerEntity>,
    private readonly activityService: AgentActivityService,
  ) {}

  async list(agentId: string, query: ListWorksheetQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);

    const qb = this.worksheetRepo
      .createQueryBuilder('t')
      .where('t.agentId = :agentId', { agentId });

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.dueDate) {
      qb.andWhere('t.dueDate = :dueDate', { dueDate: query.dueDate });
    }

    qb.orderBy('t.dueDate', 'ASC').addOrderBy('t.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const customerIds = [
      ...new Set(data.map((t) => t.customerId).filter(Boolean)),
    ] as string[];
    const customers = customerIds.length
      ? await this.customerRepo
          .createQueryBuilder('c')
          .where('c.id IN (:...ids)', { ids: customerIds })
          .getMany()
      : [];
    const customerMap = new Map(
      customers.map((c) => [
        c.id,
        `${c.firstName} ${c.lastName ?? ''}`.trim(),
      ]),
    );

    return paginate(
      data.map((task) => ({
        ...task,
        customerName: task.customerId
          ? customerMap.get(task.customerId) ?? null
          : null,
      })),
      total,
      page,
      limit,
    );
  }

  async create(agentId: string, dto: CreateWorksheetDto) {
    if (dto.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: dto.customerId, assignedAgentId: agentId },
      });
      if (!customer) {
        throw new ForbiddenException('Customer is not assigned to you');
      }
    }

    const task = await this.worksheetRepo.save(
      this.worksheetRepo.create({
        ...dto,
        agentId,
        status: dto.status ?? WorksheetTaskStatus.PENDING,
      }),
    );

    await this.activityService.log({
      agentId,
      customerId: dto.customerId,
      action: AgentActivityAction.WORKSHEET_CREATED,
      description: `Worksheet task created: ${task.title}`,
    });

    return task;
  }

  async update(agentId: string, taskId: string, dto: UpdateWorksheetDto) {
    const task = await this.worksheetRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.agentId !== agentId) {
      throw new ForbiddenException('Task does not belong to you');
    }

    Object.assign(task, dto);
    const saved = await this.worksheetRepo.save(task);

    const isCompleted = saved.status === WorksheetTaskStatus.COMPLETED;
    await this.activityService.log({
      agentId,
      customerId: saved.customerId,
      action: isCompleted
        ? AgentActivityAction.WORKSHEET_COMPLETED
        : AgentActivityAction.WORKSHEET_UPDATED,
      description: isCompleted
        ? `Worksheet task completed: ${saved.title}`
        : `Worksheet task updated: ${saved.title}`,
    });

    return saved;
  }

  async remove(agentId: string, taskId: string) {
    const task = await this.worksheetRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.agentId !== agentId) {
      throw new ForbiddenException('Task does not belong to you');
    }
    await this.worksheetRepo.remove(task);

    await this.activityService.log({
      agentId,
      customerId: task.customerId,
      action: AgentActivityAction.WORKSHEET_DELETED,
      description: `Worksheet task deleted: ${task.title}`,
    });

    return { message: 'Task deleted' };
  }
}
