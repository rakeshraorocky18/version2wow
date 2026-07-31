import { IsString, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckMobileDto {
  @ApiProperty({ example: '9876543210', description: '10 digit mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobile!: string;
}

export class RequestMobileOtpDto {
  @ApiProperty({ example: '9876543210', description: '10 digit mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobile!: string;

  @ApiProperty({ example: 'session-12345', description: 'Temporary wizard session ID' })
  @IsNotEmpty()
  @IsString()
  sessionId!: string;
}

export class VerifyMobileOtpDto {
  @ApiProperty({ example: '9876543210', description: '10 digit mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobile!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp!: string;

  @ApiProperty({ example: 'session-12345', description: 'Temporary wizard session ID' })
  @IsNotEmpty()
  @IsString()
  sessionId!: string;
}

export class CleanupMobileSessionDto {
  @ApiProperty({ example: 'session-12345', description: 'Temporary wizard session ID' })
  @IsNotEmpty()
  @IsString()
  sessionId!: string;
}
