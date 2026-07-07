import { IsString, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PersonalDetailsDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsArray() languagesKnown?: string[];
}

export class EducationEntryDto {
  @IsOptional() @IsString() qualification?: string;
  @IsOptional() @IsString() degree?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() institutionName?: string;
  @IsOptional() @IsString() universityBoard?: string;
  @IsOptional() @IsString() startYear?: string;
  @IsOptional() @IsString() endYear?: string;
  @IsOptional() @IsString() percentageCgpa?: string;
  @IsOptional() @IsString() certifications?: string;
}

export class ExperienceDto {
  @IsOptional() currentlyWorking?: boolean;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() employmentType?: string;
  @IsOptional() @IsString() yearsOfExperience?: string;
  @IsOptional() @IsString() currentSalary?: string;
  @IsOptional() @IsString() skills?: string;
  @IsOptional() @IsString() linkedIn?: string;
  @IsOptional() @IsString() portfolioWebsite?: string;
  @IsOptional() @IsString() resumeUrl?: string;
}

export class ExpressYourselfDto {
  @IsOptional() @IsString() aboutMe?: string;
  @IsOptional() @IsString() lookingFor?: string;
  @IsOptional() @IsString() lifeGoals?: string;
  @IsOptional() @IsString() myStrengths?: string;
  @IsOptional() @IsString() favoriteQuote?: string;
  @IsOptional() @IsString() futureDreams?: string;
  @IsOptional() @IsString() whatMakesMeHappy?: string;
  @IsOptional() @IsString() anythingElse?: string;
}

export class WizardProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalDetailsDto)
  personalDetails?: PersonalDetailsDto;

  @ApiPropertyOptional({ type: [EducationEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  education?: EducationEntryDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExperienceDto)
  experience?: ExperienceDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  hobbies?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExpressYourselfDto)
  expressYourself?: ExpressYourselfDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  existingPhotoUrl?: string;
}
