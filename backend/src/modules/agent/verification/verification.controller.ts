import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AadhaarVerificationService } from './verification.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Agent Customer Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('aadhaar')
export class AadhaarVerificationController {
  constructor(private readonly verificationService: AadhaarVerificationService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Request Aadhaar Verification OTP' })
  sendOtp(@Body() dto: RequestOtpDto) {
    return this.verificationService.sendOtp(dto.aadhaarNumber);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify Aadhaar OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.verificationService.verifyOtp(dto.aadhaarNumber, dto.otp);
  }
}
