import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import {
  WorksheetPriority,
  WorksheetTaskStatus,
} from '../../common/enums/agent.enums';

export class CreateWorksheetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: WorksheetPriority })
  @IsOptional()
  @IsEnum(WorksheetPriority)
  priority?: WorksheetPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: WorksheetTaskStatus })
  @IsOptional()
  @IsEnum(WorksheetTaskStatus)
  status?: WorksheetTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorksheetDto extends PartialType(CreateWorksheetDto) {}

export class ListWorksheetQueryDto {
  @ApiPropertyOptional({ enum: WorksheetTaskStatus })
  @IsOptional()
  @IsEnum(WorksheetTaskStatus)
  status?: WorksheetTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
