import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AgentCustomerStatus } from '../../common/enums/agent.enums';

/** Query strings arrive as "" for missing filters — treat those as undefined. */
function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  return value;
}

function toOptionalStatus({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
}

function toOptionalSortBy({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    // Accept createdAt as an alias for date (newest/oldest by createdAt).
    if (value === 'createdAt') return 'date';
    return value;
  }
  return value;
}

function parseDateOfBirth(value: unknown): Date | null {
  if (value === '' || value === null || value === undefined) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

@ValidatorConstraint({ name: 'isAdultDateOfBirth', async: false })
class IsAdultDateOfBirthConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    const dob = parseDateOfBirth(value);
    if (!dob) return true;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 18;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Customer must be at least 18 years old.';
  }
}

export class CreateAgentCustomerDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  @Validate(IsAdultDateOfBirthConstraint)
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v !== undefined)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  religion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  caste?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  education?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  personalDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  familyDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  educationDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  religionDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  partnerPreferences?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  aadhaarNumber?: string;

  @ApiPropertyOptional({ enum: AgentCustomerStatus })
  @IsOptional()
  @Transform(toOptionalStatus)
  @IsEnum(AgentCustomerStatus)
  status?: AgentCustomerStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class UpdateAgentCustomerDto extends PartialType(CreateAgentCustomerDto) {}

/**
 * Query DTO for GET /agent/customers.
 *
 * Exact 400 cause previously: `status=` (empty string) failed `@IsEnum`
 * because `@IsOptional()` only skips null/undefined — not "".
 */
export class ListCustomersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AgentCustomerStatus })
  @IsOptional()
  @Transform(toOptionalStatus)
  @IsEnum(AgentCustomerStatus, {
    message: `status must be one of: ${Object.values(AgentCustomerStatus).join(', ')}`,
  })
  status?: AgentCustomerStatus;

  @ApiPropertyOptional({
    enum: ['name', 'date', 'completion', 'createdAt'],
    description: 'createdAt is an alias for date',
  })
  @IsOptional()
  @Transform(toOptionalSortBy)
  @IsIn(['name', 'date', 'completion'], {
    message: 'sortBy must be one of: name, date, completion, createdAt',
  })
  sortBy?: 'name' | 'date' | 'completion';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC', 'asc', 'desc'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value.toUpperCase();
    return value;
  })
  @IsIn(['ASC', 'DESC'], {
    message: 'sortOrder must be ASC or DESC',
  })
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
