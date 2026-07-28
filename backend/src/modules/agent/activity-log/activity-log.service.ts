import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentActivityEntity } from '../common/entities/agent-activity.entity';
import { AgentActivityAction } from '../common/enums/agent.enums';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { paginate } from '../../../common/utils/pagination';

@Injectable()
export class AgentActivityService {
  constructor(
    @InjectRepository(AgentActivityEntity, POSTGRES_CONNECTION)
    private readonly activityRepo: Repository<AgentActivityEntity>,
  ) {}

  async log(params: {
    agentId: string;
    customerId?: string | null;
    action: AgentActivityAction;
    description: string;
  }) {
    const entry = this.activityRepo.create({
      agentId: params.agentId,
      customerId: params.customerId ?? undefined,
      action: params.action,
      description: params.description,
    });
    return this.activityRepo.save(entry);
  }

  async listForAgent(
    agentId: string,
    query: { page?: number; limit?: number; customerId?: string } = {},
  ) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const where: Record<string, string> = { agentId };
    if (query.customerId) where.customerId = query.customerId;

    const [data, total] = await this.activityRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }

  async recent(agentId: string, take = 8) {
    return this.activityRepo.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
      take,
    });
  }
}
