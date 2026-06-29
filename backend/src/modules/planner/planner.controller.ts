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
import {
  CreatePlanDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
  CreateEventDto,
} from './dto/planner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('planner')
@Controller('planner')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

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
  async getTasks(@Param('planId') planId: string) {
    return this.plannerService.getTasks(planId);
  }

  @Post('plan/:planId/tasks')
  @ApiOperation({ summary: 'Create a task' })
  async createTask(@Param('planId') planId: string, @Body() dto: CreateTaskDto) {
    return this.plannerService.createTask(planId, dto);
  }

  @Put('tasks/:taskId/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.plannerService.updateTaskStatus(taskId, dto);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Param('taskId') taskId: string) {
    await this.plannerService.deleteTask(taskId);
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
