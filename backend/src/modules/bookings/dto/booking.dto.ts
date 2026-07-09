import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  BookingStatus,
  PaymentMethod,
} from '../../../common/enums';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  vendorId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiProperty()
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  advancePaid?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userNotes?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class InitiatePaymentDto {
  @ApiProperty()
  @IsString()
  bookingId!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isEscrow?: boolean;
}

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  transactionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatewayOrderId?: string;
}

export class RefundDto {
  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsString()
  reason!: string;
}