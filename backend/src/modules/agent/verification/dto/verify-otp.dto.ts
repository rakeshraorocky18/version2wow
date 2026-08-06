import { Matches, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '123456789012', description: '12-digit Aadhaar Number' })
  @Matches(/^\d{12}$/, { message: 'Aadhaar must be exactly 12 numeric digits' })
  aadhaarNumber!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 numeric digits' })
  otp!: string;

  @ApiProperty({ example: 'sess-abc123', description: 'Verification session identifier' })
  @IsString()
  sessionId!: string;
}
