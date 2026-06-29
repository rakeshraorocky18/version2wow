import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../../common/enums';

export class CreateProfileDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caste?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  income?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: {
    city: string;
    state: string;
    country: string;
    pincode: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  familyDetails?: {
    fatherName: string;
    motherName: string;
    siblings: number;
    familyType: string;
    familyStatus: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  interests?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  preferences?: {
    ageRange: { min: number; max: number };
    heightRange: { min: number; max: number };
    religions: string[];
    education: string[];
    locations: string[];
  };
}

export class UpdateProfileDto extends CreateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare lastName: string;
}
