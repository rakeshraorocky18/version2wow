import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  
  @Post('forgot-password')
@ApiOperation({ summary: 'Send OTP for password reset' })
async forgotPassword(
  @Body() forgotPasswordDto: ForgotPasswordDto,
) {
  return this.authService.forgotPassword(forgotPasswordDto);
}

@Post('verify-otp')
@ApiOperation({ summary: 'Verify password reset OTP' })
async verifyOtp(
  @Body() verifyOtpDto: VerifyOtpDto,
) {
  return this.authService.verifyOtp(verifyOtpDto);
}

@Post('reset-password')
@ApiOperation({ summary: 'Reset password using OTP' })
async resetPassword(
  @Body() resetPasswordDto: ResetPasswordDto,
) {
  return this.authService.resetPassword(resetPasswordDto);
}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: any) {
    return this.authService.refreshTokens(req.user?.id, refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @Post('send-login-otp')
sendLoginOtp(@Body() dto: ForgotPasswordDto) {
  return this.authService.sendLoginOtp(dto);
}

@Post('login-with-otp')
loginWithOtp(@Body() dto: VerifyOtpDto) {
  return this.authService.loginWithOtp(dto);
}

}

