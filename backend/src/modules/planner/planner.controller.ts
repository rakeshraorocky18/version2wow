import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlannerService } from './planner.service';
import { PlannerDashboardService } from './planner-dashboard.service';
import {
  CreatePlanDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
  CreateEventDto,
  CreateSubtaskDto,
} from './dto/planner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('planner')
@Controller('planner')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlannerController {
  constructor(
    private readonly plannerService: PlannerService,
    private readonly dashboardService: PlannerDashboardService,
  ) {}

  // ─── Dashboard API (specific routes before parameterized) ───

  @Get()
  @ApiOperation({ summary: 'Get planner dashboard overview' })
  async getDashboard(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getDashboard(req.user.id, planId);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get planner tasks' })
  async getDashboardTasks(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getTasks(req.user.id, planId);
  }

  @Get('budget')
  @ApiOperation({ summary: 'Get planner budget summary' })
  async getDashboardBudget(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getBudget(req.user.id, planId);
  }

  @Get('countdown')
  @ApiOperation({ summary: 'Get wedding countdown' })
  async getCountdown(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getCountdown(req.user.id, planId);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get vendor recommendations' })
  async getVendorRecommendations(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getVendors(req.user.id, planId);
  }

  @Get('guests')
  @ApiOperation({ summary: 'Get guest management stats' })
  async getGuests(@Req() req: any) {
    return this.dashboardService.getGuests(req.user.id);
  }

  @Get('rsvp')
  @ApiOperation({ summary: 'Get RSVP dashboard data' })
  async getRsvp(@Req() req: any) {
    return this.dashboardService.getRsvp(req.user.id);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get planner notifications' })
  async getNotifications(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getNotifications(req.user.id, planId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent planner activity' })
  async getActivity(@Req() req: any, @Query('planId') planId?: string) {
    return this.dashboardService.getActivity(req.user.id, planId);
  }

  @Get('inspiration')
  @ApiOperation({ summary: 'Get wedding inspiration themes' })
  async getInspiration() {
    return this.dashboardService.getInspiration();
  }

  // ─── Plan CRUD ───

  @Post('plan')
  @ApiOperation({ summary: 'Create wedding plan' })
  async createPlan(@Req() req: any, @Body() dto: CreatePlanDto) {
    return this.plannerService.createPlan(req.user.id, dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all wedding plans' })
  async listPlans(@Req() req: any) {
    return this.plannerService.listPlans(req.user.id);
  }

  @Get('plan')
  @ApiOperation({ summary: 'Get wedding plan' })
  async getPlan(@Req() req: any) {
    return this.plannerService.getPlan(req.user.id);
  }

  @Put('plan')
  @ApiOperation({ summary: 'Update wedding plan' })
  async updatePlan(@Req() req: any, @Body() dto: Partial<CreatePlanDto>) {
    return this.plannerService.updatePlan(req.user.id, dto);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get full wedding timeline' })
  async getTimeline(@Req() req: any, @Query('planId') planId?: string) {
    return this.plannerService.getTimeline(req.user.id, planId);
  }

  @Get('plan/:planId/tasks')
  @ApiOperation({ summary: 'Get tasks for a plan' })
  async getTasks(@Req() req: any, @Param('planId') planId: string) {
    return this.plannerService.getTasks(planId, req.user.id);
  }

  @Get('plan/:planId/activity')
  @ApiOperation({ summary: 'Get recent planner activity' })
  async getActivities(@Req() req: any, @Param('planId') planId: string) {
    return this.plannerService.getActivities(planId, req.user.id);
  }

  @Post('plan/:planId/tasks')
  @ApiOperation({ summary: 'Create a task' })
  async createTask(@Req() req: any, @Param('planId') planId: string, @Body() dto: CreateTaskDto) {
    return this.plannerService.createTask(planId, req.user.id, dto);
  }

  @Post('tasks/:taskId/subtasks')
  @ApiOperation({ summary: 'Create a subtask' })
  async createSubtask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.plannerService.createSubtask(taskId, req.user.id, dto);
  }

  @Put('tasks/:taskId/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateTaskStatus(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.plannerService.updateTaskStatus(taskId, req.user.id, dto);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Req() req: any, @Param('taskId') taskId: string) {
    await this.plannerService.deleteTask(taskId, req.user.id);
    return { message: 'Task deleted' };
  }

  @Get('plan/:planId/events')
  @ApiOperation({ summary: 'Get events for a plan' })
  async getEvents(@Param('planId') planId: string) {
    return this.plannerService.getEvents(planId);
  }

  @Post('plan/:planId/events')
  @ApiOperation({ summary: 'Create an event' })
  async createEvent(@Param('planId') planId: string, @Body() dto: CreateEventDto) {
    return this.plannerService.createEvent(planId, dto);
  }
}
