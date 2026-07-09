import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType, RsvpStatus } from '../../../common/enums';

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
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedGuests?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;
}

export class AddGuestDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  partySize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dietaryPreference?: string;
}

export class UpdateRsvpDto {
  @ApiProperty({ enum: RsvpStatus })
  @IsEnum(RsvpStatus)
  rsvpStatus: RsvpStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rsvpMessage?: string;
}

export class AssignSeatDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seatNumber?: string;
}
