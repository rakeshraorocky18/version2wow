import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AgentWorksheetEntity } from '../common/entities/agent-worksheet.entity';
import {
  AgentCustomerStatus,
  WorksheetTaskStatus,
} from '../common/enums/agent.enums';
import { AgentActivityService } from '../activity-log/activity-log.service';

@Injectable()
export class AgentDashboardService {
  constructor(
    @InjectRepository(AgentCustomerEntity, POSTGRES_CONNECTION)
    private readonly customerRepo: Repository<AgentCustomerEntity>,
    @InjectRepository(AgentWorksheetEntity, POSTGRES_CONNECTION)
    private readonly worksheetRepo: Repository<AgentWorksheetEntity>,
    private readonly activityService: AgentActivityService,
  ) {}

  async getDashboard(agentId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const totalCustomers = await this.customerRepo.count({
      where: { assignedAgentId: agentId },
    });

    const activeCustomers = await this.customerRepo.count({
      where: {
        assignedAgentId: agentId,
        status: AgentCustomerStatus.ACTIVE,
      },
    });

    const pendingProfiles = await this.customerRepo.count({
      where: {
        assignedAgentId: agentId,
        status: In([AgentCustomerStatus.PENDING, AgentCustomerStatus.DRAFT]),
      },
    });

    const completionAgg = await this.customerRepo
      .createQueryBuilder('c')
      .select('AVG(c.profileCompletion)', 'avg')
      .where('c.assignedAgentId = :agentId', { agentId })
      .getRawOne<{ avg: string | null }>();

    const profileCompletionPercentage = Math.round(
      Number(completionAgg?.avg ?? 0),
    );

    const todaysTasks = await this.worksheetRepo.count({
      where: {
        agentId,
        dueDate: today,
        status: In([
          WorksheetTaskStatus.PENDING,
          WorksheetTaskStatus.IN_PROGRESS,
        ]),
      },
    });

    const overdueTasks = await this.worksheetRepo.count({
      where: {
        agentId,
        dueDate: LessThan(today),
        status: In([
          WorksheetTaskStatus.PENDING,
          WorksheetTaskStatus.IN_PROGRESS,
        ]),
      },
    });

    const recentlyAddedCustomers = await this.customerRepo.find({
      where: { assignedAgentId: agentId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const todayPendingTasks = await this.worksheetRepo.find({
      where: {
        agentId,
        dueDate: today,
        status: WorksheetTaskStatus.PENDING,
      },
      order: { priority: 'ASC', createdAt: 'DESC' },
      take: 8,
    });

    const recentActivities = await this.activityService.recent(agentId, 8);

    return {
      totalCustomers,
      activeCustomers,
      profileCompletionPercentage,
      pendingProfiles,
      todaysTasks,
      overdueTasks,
      recentlyAddedCustomers,
      todayPendingTasks,
      recentActivities,
    };
  }
}
