import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingPlan, WeddingTask, WeddingEvent } from './entities/planner.entity';
import { CreatePlanDto, CreateTaskDto, UpdateTaskStatusDto, CreateEventDto } from './dto/planner.dto';
import { TaskStatus } from '../../common/enums';

@Injectable()
export class PlannerService {
  private readonly defaultTasks = [
    { title: 'Set wedding budget', category: 'Finance', priority: 1 },
    { title: 'Create guest list', category: 'Guests', priority: 1 },
    { title: 'Book venue', category: 'Venue', priority: 2 },
    { title: 'Hire photographer', category: 'Photography', priority: 3 },
    { title: 'Book caterer', category: 'Catering', priority: 3 },
    { title: 'Choose wedding attire', category: 'Attire', priority: 4 },
    { title: 'Select decorations', category: 'Decor', priority: 4 },
    { title: 'Book entertainment', category: 'Entertainment', priority: 5 },
    { title: 'Send invitations', category: 'Guests', priority: 5 },
    { title: 'Arrange transport', category: 'Logistics', priority: 6 },
    { title: 'Plan honeymoon', category: 'Travel', priority: 7 },
    { title: 'Wedding rehearsal', category: 'Ceremony', priority: 8 },
  ];

  constructor(
    @InjectRepository(WeddingPlan)
    private planRepository: Repository<WeddingPlan>,
    @InjectRepository(WeddingTask)
    private taskRepository: Repository<WeddingTask>,
    @InjectRepository(WeddingEvent)
    private eventRepository: Repository<WeddingEvent>,
  ) {}

  async createPlan(userId: string, dto: CreatePlanDto): Promise<WeddingPlan> {
    const plan = this.planRepository.create({ userId, ...dto });
    const savedPlan = await this.planRepository.save(plan);

    // Auto-generate default tasks
    const tasks = this.defaultTasks.map((task) =>
      this.taskRepository.create({
        planId: savedPlan.id,
        ...task,
        status: TaskStatus.PENDING,
      }),
    );
    await this.taskRepository.save(tasks);

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

  async getTasks(planId: string): Promise<WeddingTask[]> {
    return this.taskRepository.find({
      where: { planId },
      order: { priority: 'ASC', dueDate: 'ASC' },
    });
  }

  async createTask(planId: string, dto: CreateTaskDto): Promise<WeddingTask> {
    const task = this.taskRepository.create({ planId, ...dto });
    return this.taskRepository.save(task);
  }

  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto): Promise<WeddingTask> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    task.status = dto.status;
    return this.taskRepository.save(task);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.taskRepository.delete(taskId);
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
      const scopedPlan = await this.planRepository.findOne({ where: { id: planId, userId } });
      if (!scopedPlan) throw new NotFoundException('Wedding plan not found');
      plan = scopedPlan;
    } else {
      plan = await this.getPlan(userId);
    }

    const [tasks, events] = await Promise.all([
      this.getTasks(plan.id),
      this.getEvents(plan.id),
    ]);

    return {
      plan,
      tasks,
      events,
      progress: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
        percentage: tasks.length
          ? Math.round(
              (tasks.filter((t) => t.status === TaskStatus.COMPLETED).length / tasks.length) * 100,
            )
          : 0,
      },
    };
  }
}
