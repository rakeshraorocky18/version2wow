
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorCategory } from '../../../common/enums';

export class CreateVendorDto {
  @ApiProperty()
  @IsString()
  businessName: string;

  @ApiProperty({ enum: VendorCategory })
  @IsEnum(VendorCategory)
  category: VendorCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: {
    city: string;
    state: string;
    address: string;
    pincode: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  pricing?: {
    startingPrice: number;
    currency: string;
    priceType: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  services?: string[];
}

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  review?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  photos?: string[];
}
