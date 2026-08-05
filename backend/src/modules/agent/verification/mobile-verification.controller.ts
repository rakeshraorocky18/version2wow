import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { MobileVerificationService } from './mobile-verification.service';
import { CheckMobileDto, RequestMobileOtpDto, VerifyMobileOtpDto, CleanupMobileSessionDto } from './dto/mobile-verification.dto';

@ApiTags('Agent Customer Mobile Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('mobile')
export class MobileVerificationController {
  constructor(private readonly verificationService: MobileVerificationService) {}

  @Post('check')
  @ApiOperation({ summary: 'Check if mobile number already exists' })
  checkMobile(@Body() dto: CheckMobileDto) {
    return this.verificationService.checkMobile(dto.mobile);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Request Mobile Verification OTP' })
  sendOtp(@Body() dto: RequestMobileOtpDto, @Req() req: any) {
    const agentId = req.user?.id;
    return this.verificationService.sendOtp(dto.mobile, dto.sessionId, agentId);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify Mobile OTP' })
  verifyOtp(@Body() dto: VerifyMobileOtpDto) {
    return this.verificationService.verifyOtp(dto.mobile, dto.otp, dto.sessionId);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Discard temporary mobile verification session' })
  cleanupSession(@Body() dto: CleanupMobileSessionDto) {
    return this.verificationService.cleanupSession(dto.sessionId);
  }
}
