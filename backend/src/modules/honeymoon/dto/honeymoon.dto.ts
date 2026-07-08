import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HoneymoonPackageType } from '../../../common/enums';

export class CreatePackageDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  destination: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ enum: HoneymoonPackageType })
  @IsEnum(HoneymoonPackageType)
  type: HoneymoonPackageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  durationNights: number;

  @ApiProperty()
  @IsNumber()
  durationDays: number;

  @ApiProperty()
  @IsNumber()
  pricePerPerson: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  couplePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  inclusions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  exclusions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  highlights?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hotelName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hotelRating?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  flightIncluded?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visaRequired?: boolean;
}

export class BookPackageDto {
  @ApiProperty()
  @IsString()
  packageId: string;

  @ApiProperty()
  @IsDateString()
  travelDate: string;

  @ApiProperty()
  @IsDateString()
  returnDate: string;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsNumber()
  travellers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class SearchPackagesDto {
  destination?: string;
  type?: HoneymoonPackageType;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  page?: number;
  limit?: number;
  includeExternal?: boolean;
}
