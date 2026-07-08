import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingPlan, WeddingTask, WeddingEvent, PlannerActivity } from './entities/planner.entity';
import { CreatePlanDto, CreateTaskDto, UpdateTaskStatusDto, CreateEventDto, CreateSubtaskDto } from './dto/planner.dto';
import { TaskStatus, TaskPriorityLevel, PlannerActivityAction } from '../../common/enums';

type DefaultTaskTemplate = {
  title: string;
  category: string;
  priorityLevel: TaskPriorityLevel;
  priority: number;
  monthsBefore: number;
  subtasks?: string[];
};

@Injectable()
export class PlannerService {
  private readonly defaultTasks: DefaultTaskTemplate[] = [
    {
      title: 'Book venue',
      category: 'Venue',
      priorityLevel: TaskPriorityLevel.HIGH,
      priority: 1,
      monthsBefore: 12,
      subtasks: ['Visit venue', 'Check pricing', 'Pay advance', 'Sign agreement'],
    },
    {
      title: 'Hire photographer',
      category: 'Photography',
      priorityLevel: TaskPriorityLevel.HIGH,
      priority: 2,
      monthsBefore: 9,
    },
    {
      title: 'Book caterer',
      category: 'Catering',
      priorityLevel: TaskPriorityLevel.HIGH,
      priority: 3,
      monthsBefore: 8,
    },
    {
      title: 'Choose wedding attire',
      category: 'Shopping',
      priorityLevel: TaskPriorityLevel.MEDIUM,
      priority: 4,
      monthsBefore: 6,
    },
    {
      title: 'Order invitations',
      category: 'Documentation',
      priorityLevel: TaskPriorityLevel.MEDIUM,
      priority: 5,
      monthsBefore: 4,
    },
    {
      title: 'Collect marriage documents',
      category: 'Documentation',
      priorityLevel: TaskPriorityLevel.HIGH,
      priority: 6,
      monthsBefore: 3,
    },
    {
      title: 'Finalize decorations',
      category: 'Other',
      priorityLevel: TaskPriorityLevel.MEDIUM,
      priority: 7,
      monthsBefore: 2,
    },
    {
      title: 'Confirm vendors',
      category: 'Other',
      priorityLevel: TaskPriorityLevel.MEDIUM,
      priority: 8,
      monthsBefore: 1,
    },
    {
      title: 'Wedding rehearsal',
      category: 'Venue',
      priorityLevel: TaskPriorityLevel.LOW,
      priority: 9,
      monthsBefore: 0,
      subtasks: ['Confirm timing', 'Walk through ceremony'],
    },
    {
      title: 'Wedding day checklist',
      category: 'Other',
      priorityLevel: TaskPriorityLevel.HIGH,
      priority: 10,
      monthsBefore: 0,
      subtasks: ['Pack emergency kit', 'Confirm transport', 'Review timeline'],
    },
  ];

  constructor(
    @InjectRepository(WeddingPlan)
    private planRepository: Repository<WeddingPlan>,
    @InjectRepository(WeddingTask)
    private taskRepository: Repository<WeddingTask>,
    @InjectRepository(WeddingEvent)
    private eventRepository: Repository<WeddingEvent>,
    @InjectRepository(PlannerActivity)
    private activityRepository: Repository<PlannerActivity>,
  ) {}

  private dueDateFromWedding(weddingDate: string, monthsBefore: number): string {
    const date = new Date(weddingDate);
    date.setMonth(date.getMonth() - monthsBefore);
    return date.toISOString().split('T')[0];
  }

  private daysUntilWedding(weddingDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wedding = new Date(weddingDate);
    wedding.setHours(0, 0, 0, 0);
    return Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async logActivity(
    planId: string,
    action: PlannerActivityAction,
    taskTitle: string,
    taskId?: string,
    details?: string,
  ) {
    const activity = this.activityRepository.create({
      planId,
      taskId,
      taskTitle,
      action,
      details,
    });
    await this.activityRepository.save(activity);
  }

  private async assertPlanOwnership(planId: string, userId: string): Promise<WeddingPlan> {
    const plan = await this.planRepository.findOne({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Wedding plan not found');
    return plan;
  }

  private async assertTaskAccess(taskId: string, userId: string): Promise<WeddingTask> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertPlanOwnership(task.planId, userId);
    return task;
  }

  private isTaskComplete(task: WeddingTask, subtasks: WeddingTask[]): boolean {
    const children = subtasks.filter((s) => s.parentTaskId === task.id);
    if (children.length > 0) {
      return children.every((s) => s.status === TaskStatus.COMPLETED);
    }
    return task.status === TaskStatus.COMPLETED;
  }

  private computeProgress(parentTasks: WeddingTask[], allTasks: WeddingTask[]) {
    if (parentTasks.length === 0) {
      return { total: 0, completed: 0, pending: 0, percentage: 0 };
    }

    let completedUnits = 0;
    for (const task of parentTasks) {
      const children = allTasks.filter((s) => s.parentTaskId === task.id);
      if (children.length > 0) {
        const done = children.filter((s) => s.status === TaskStatus.COMPLETED).length;
        completedUnits += done / children.length;
      } else if (task.status === TaskStatus.COMPLETED) {
        completedUnits += 1;
      }
    }

    const completed = parentTasks.filter((t) => this.isTaskComplete(t, allTasks)).length;
    const percentage = Math.round((completedUnits / parentTasks.length) * 100);

    return {
      total: parentTasks.length,
      completed,
      pending: parentTasks.length - completed,
      percentage,
    };
  }

  private async syncParentTask(parentTaskId: string) {
    const parent = await this.taskRepository.findOne({ where: { id: parentTaskId } });
    if (!parent) return;

    const subtasks = await this.taskRepository.find({ where: { parentTaskId } });
    if (subtasks.length === 0) return;

    const allComplete = subtasks.every((s) => s.status === TaskStatus.COMPLETED);
    const anyProgress = subtasks.some(
      (s) => s.status === TaskStatus.COMPLETED || s.status === TaskStatus.IN_PROGRESS,
    );

    const nextStatus = allComplete
      ? TaskStatus.COMPLETED
      : anyProgress
        ? TaskStatus.IN_PROGRESS
        : TaskStatus.PENDING;

    if (parent.status !== nextStatus) {
      parent.status = nextStatus;
      await this.taskRepository.save(parent);
      await this.logActivity(
        parent.planId,
        allComplete ? PlannerActivityAction.COMPLETED : PlannerActivityAction.UPDATED,
        parent.title,
        parent.id,
        allComplete ? 'All subtasks completed' : 'Subtask progress updated',
      );
    }
  }

  async createPlan(userId: string, dto: CreatePlanDto): Promise<WeddingPlan> {
    const plan = this.planRepository.create({ userId, ...dto });
    const savedPlan = await this.planRepository.save(plan);

    for (const template of this.defaultTasks) {
      const parent = await this.taskRepository.save(
        this.taskRepository.create({
          planId: savedPlan.id,
          title: template.title,
          category: template.category,
          priority: template.priority,
          priorityLevel: template.priorityLevel,
          dueDate: this.dueDateFromWedding(savedPlan.weddingDate, template.monthsBefore),
          status: TaskStatus.PENDING,
        }),
      );

      await this.logActivity(savedPlan.id, PlannerActivityAction.ADDED, parent.title, parent.id);

      if (template.subtasks?.length) {
        for (const [index, title] of template.subtasks.entries()) {
          const subtask = await this.taskRepository.save(
            this.taskRepository.create({
              planId: savedPlan.id,
              parentTaskId: parent.id,
              title,
              category: template.category,
              priority: template.priority + index + 1,
              priorityLevel: template.priorityLevel,
              dueDate: parent.dueDate,
              status: TaskStatus.PENDING,
            }),
          );
          await this.logActivity(savedPlan.id, PlannerActivityAction.ADDED, subtask.title, subtask.id, 'Subtask added');
        }
      }
    }

    return savedPlan;
  }

  async listPlans(userId: string): Promise<WeddingPlan[]> {
    return this.planRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPlan(userId: string): Promise<WeddingPlan> {
    const plan = await this.planRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!plan) throw new NotFoundException('Wedding plan not found');
    return plan;
  }

  async updatePlan(userId: string, dto: Partial<CreatePlanDto>): Promise<WeddingPlan> {
    const plan = await this.getPlan(userId);
    Object.assign(plan, dto);
    return this.planRepository.save(plan);
  }

  async getTasks(planId: string, userId?: string): Promise<WeddingTask[]> {
    if (userId) await this.assertPlanOwnership(planId, userId);
    return this.taskRepository.find({
      where: { planId },
      order: { priority: 'ASC', dueDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async createTask(planId: string, userId: string, dto: CreateTaskDto): Promise<WeddingTask> {
    await this.assertPlanOwnership(planId, userId);
    const task = await this.taskRepository.save(
      this.taskRepository.create({
        planId,
        priorityLevel: TaskPriorityLevel.MEDIUM,
        ...dto,
      }),
    );
    await this.logActivity(planId, PlannerActivityAction.ADDED, task.title, task.id);
    return task;
  }

  async createSubtask(taskId: string, userId: string, dto: CreateSubtaskDto): Promise<WeddingTask> {
    const parent = await this.assertTaskAccess(taskId, userId);
    if (parent.parentTaskId) throw new ForbiddenException('Cannot add subtasks to a subtask');

    const subtask = await this.taskRepository.save(
      this.taskRepository.create({
        planId: parent.planId,
        parentTaskId: parent.id,
        title: dto.title,
        category: parent.category,
        priorityLevel: parent.priorityLevel,
        dueDate: parent.dueDate,
        status: TaskStatus.PENDING,
        priority: parent.priority + 1,
      }),
    );

    await this.logActivity(parent.planId, PlannerActivityAction.ADDED, subtask.title, subtask.id, 'Subtask added');
    await this.syncParentTask(parent.id);
    return subtask;
  }

  async updateTaskStatus(taskId: string, userId: string, dto: UpdateTaskStatusDto): Promise<WeddingTask> {
    const task = await this.assertTaskAccess(taskId, userId);
    const previous = task.status;
    task.status = dto.status;
    const saved = await this.taskRepository.save(task);

    if (dto.status === TaskStatus.COMPLETED && previous !== TaskStatus.COMPLETED) {
      await this.logActivity(task.planId, PlannerActivityAction.COMPLETED, task.title, task.id);
    } else if (previous !== dto.status) {
      await this.logActivity(
        task.planId,
        PlannerActivityAction.UPDATED,
        task.title,
        task.id,
        `Status changed to ${dto.status}`,
      );
    }

    if (task.parentTaskId) {
      await this.syncParentTask(task.parentTaskId);
    }

    return saved;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.assertTaskAccess(taskId, userId);
    await this.taskRepository.delete({ parentTaskId: taskId });
    await this.taskRepository.delete(taskId);
    await this.logActivity(task.planId, PlannerActivityAction.UPDATED, task.title, taskId, 'Task deleted');
  }

  async getActivities(planId: string, userId: string, limit = 20): Promise<PlannerActivity[]> {
    await this.assertPlanOwnership(planId, userId);
    return this.activityRepository.find({
      where: { planId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getEvents(planId: string): Promise<WeddingEvent[]> {
    return this.eventRepository.find({
      where: { planId },
      order: { dateTime: 'ASC' },
    });
  }

  async createEvent(planId: string, dto: CreateEventDto): Promise<WeddingEvent> {
    const event = this.eventRepository.create({ planId, ...dto });
    return this.eventRepository.save(event);
  }

  async getTimeline(userId: string, planId?: string) {
    let plan: WeddingPlan;

    if (planId) {
      plan = await this.assertPlanOwnership(planId, userId);
    } else {
      plan = await this.getPlan(userId);
    }

    const [tasks, activities] = await Promise.all([
      this.getTasks(plan.id),
      this.getActivities(plan.id, userId, 15),
    ]);

    const parentTasks = tasks.filter((t) => !t.parentTaskId);
    const progress = this.computeProgress(parentTasks, tasks);

    return {
      plan,
      tasks,
      activities,
      progress,
      daysRemaining: this.daysUntilWedding(plan.weddingDate),
    };
  }
}
