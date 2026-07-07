import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ManagingProfileFor,
  RepresentativeRelationship,
} from '../../../common/enums';
import { EmptyToUndefined } from '../../../common/utils/validation.helpers';

export class CreateRepresentativeProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  companyOrganization?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagesKnown?: string[];

  @ApiPropertyOptional({ enum: RepresentativeRelationship })
  @EmptyToUndefined()
  @IsOptional()
  @IsEnum(RepresentativeRelationship)
  relationship?: RepresentativeRelationship;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @ValidateIf((o) => o.relationship === RepresentativeRelationship.OTHER)
  @IsString()
  @IsNotEmpty()
  relationshipOther?: string;

  @ApiPropertyOptional({ enum: ManagingProfileFor })
  @EmptyToUndefined()
  @IsOptional()
  @IsEnum(ManagingProfileFor)
  managingProfileFor?: ManagingProfileFor;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPhoneCalls?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowWhatsApp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowEmail?: boolean;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  governmentIdUrl?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  relationshipProofUrl?: string;
}

export class UpdateRepresentativeProfileDto extends CreateRepresentativeProfileDto {}
