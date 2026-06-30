import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsObject, IsDateString, IsBoolean, IsInt } from 'class-validator';
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
  religionOther?: string;

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
  highestQualification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualificationOther?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  degreeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeUniversity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passingYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeCgpa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  currentlyWorking?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  annualIncome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yearsOfExperience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentStatusOther?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  income?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

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
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complexion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  physicalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  disabilityDetails?: string;

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
    siblingDetails?: Record<string, unknown>[];
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  horoscopeAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rashi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nakshatra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gothram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zodiacSign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  horoscope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  siblings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timeOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  horoscopeFileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manglik?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCaste?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  community?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yearsMarried?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  haveChildren?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  childrenLivingWith?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readyForRemarriage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyValues?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fatherAlive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fatherOccupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  motherAlive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherOccupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  brothers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  marriedBrothers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sisters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  marriedSisters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  siblingDetails?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drinking?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smoking?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  prefAgeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  prefAgeMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  prefHeightMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  prefHeightMax?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prefMaritalStatuses?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prefReligions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prefCastes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prefLocations?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prefCities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prefFamilyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prefFamilyStatus?: string;
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
