import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, EventType, TaskPriorityLevel } from '../../../common/enums';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  partnerName: string;

  @ApiProperty()
  @IsDateString()
  weddingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;
}

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ enum: TaskPriorityLevel })
  @IsOptional()
  @IsEnum(TaskPriorityLevel)
  priorityLevel?: TaskPriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentTaskId?: string;
}

export class CreateSubtaskDto {
  @ApiProperty()
  @IsString()
  title: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty()
  @IsDateString()
  dateTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  guestCount?: number;
}
