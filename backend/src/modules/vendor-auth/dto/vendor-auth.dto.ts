import { VendorCategory } from '../../../common/enums';
import { IsEnum, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VendorRegisterDto {
  @ApiProperty()
  @IsString()
  businessName!: string;

  @ApiProperty({ enum: VendorCategory })
  @IsEnum(VendorCategory)
  category!: VendorCategory;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @MinLength(6)
  password!: string;

  @ApiProperty()
  @IsString()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  phone!: string;
}

export class VendorLoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  password!: string;
}