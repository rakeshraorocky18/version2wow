import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AadhaarVerificationService } from './verification.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CleanupAadhaarSessionDto } from './dto/cleanup-aadhaar-session.dto';

@ApiTags('Agent Customer Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('aadhaar')
export class AadhaarVerificationController {
  constructor(private readonly verificationService: AadhaarVerificationService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Request Aadhaar Verification OTP' })
  sendOtp(@Body() dto: RequestOtpDto, @Req() req: any) {
    const agentId = req.user?.id;
    return this.verificationService.sendOtp(dto.aadhaarNumber, dto.sessionId, agentId);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify Aadhaar OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.verificationService.verifyOtp(dto.aadhaarNumber, dto.otp, dto.sessionId);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Discard temporary Aadhaar verification session' })
  cleanupSession(@Body() dto: CleanupAadhaarSessionDto) {
    return this.verificationService.cleanupSession(dto.sessionId);
  }
}
