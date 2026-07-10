import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
<<<<<<< HEAD
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User, POSTGRES_CONNECTION)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
=======
import {PasswordReset } from './entities/password-reset.entity';
import { MailService } from '../../common/mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { generateOTP } from '../../common/utils/otp';
@Injectable()
export class AuthService {
  constructor(
  @InjectRepository(User)
  private usersRepository: Repository<User>,

  @InjectRepository(PasswordReset)
  private passwordResetRepository: Repository<PasswordReset>,

  private jwtService: JwtService,
  private configService: ConfigService,
   private readonly mailService: MailService,
) {}
>>>>>>> 792f6e5cbc7cdfd5db84c292fd43e5842810f49d

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
  const user = await this.usersRepository.findOne({
    where: { email: loginDto.email },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(
    loginDto.password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const tokens = await this.generateTokens(user);
  await this.updateRefreshToken(user.id, tokens.refreshToken);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    ...tokens,
  };
}

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersRepository.update(userId, { refreshToken: '' });
  }
  
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  const user = await this.usersRepository.findOne({
    where: { email: forgotPasswordDto.email },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  const otp = generateOTP();
  console.log("================================");
  console.log("Generated OTP:", otp);
  console.log("Email:", forgotPasswordDto.email);
  console.log("================================");

  await this.passwordResetRepository.delete({
    email: forgotPasswordDto.email,
  });

  const reset = this.passwordResetRepository.create({
    email: forgotPasswordDto.email,
    otp,
    verified: false,
  });

  await this.passwordResetRepository.save(reset);

await this.mailService.sendOtp(
  forgotPasswordDto.email,
  otp,
);

return {
  message: 'OTP sent successfully',
};
  }

async sendLoginOtp(dto: ForgotPasswordDto) {
  const user = await this.usersRepository.findOne({
    where: { email: dto.email },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  const otp = generateOTP();

  await this.passwordResetRepository.delete({
    email: dto.email,
  });

  const reset = this.passwordResetRepository.create({
    email: dto.email,
    otp,
    verified: false,
  });

  await this.passwordResetRepository.save(reset);

  await this.mailService.sendOtp(dto.email, otp);

  return {
    message: 'Login OTP sent successfully',
  };
}

async verifyOtp(verifyOtpDto: VerifyOtpDto) {

  console.log("Verify OTP request:");
  console.log(verifyOtpDto);

  const reset = await this.passwordResetRepository.findOne({
    where: {
      email: verifyOtpDto.email,
      otp: verifyOtpDto.otp,
    },
  });

  console.log("Database result:", reset);

  if (!reset) {
    throw new UnauthorizedException("Invalid OTP");
  }


  reset.verified = true;

  await this.passwordResetRepository.save(reset);

  return {
    message: 'OTP verified successfully',
  };
}

async resetPassword(resetPasswordDto: ResetPasswordDto) {
  const reset = await this.passwordResetRepository.findOne({
    where: {
      email: resetPasswordDto.email,
      otp: resetPasswordDto.otp,
      verified: true,
    },
  });

  if (!reset) {
    throw new UnauthorizedException('OTP not verified');
  }

  const user = await this.usersRepository.findOne({
    where: { email: resetPasswordDto.email },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  user.password = await bcrypt.hash(resetPasswordDto.newPassword, 12);

  await this.usersRepository.save(user);

  await this.passwordResetRepository.delete({
    email: resetPasswordDto.email,
  });

  return {
    message: 'Password reset successfully',
  };
}
  private async generateTokens(user: User) {

    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    await this.usersRepository.update(userId, { refreshToken: hashedToken });
  }
  async loginWithOtp(verifyOtpDto: VerifyOtpDto) {
  const reset = await this.passwordResetRepository.findOne({
    where: {
      email: verifyOtpDto.email,
      otp: verifyOtpDto.otp,
      verified: false,
    },
  });

  if (!reset) {
    throw new UnauthorizedException('Invalid OTP');
  }

  reset.verified = true;
  await this.passwordResetRepository.save(reset);

  const user = await this.usersRepository.findOne({
    where: { email: verifyOtpDto.email },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  const tokens = await this.generateTokens(user);

  await this.updateRefreshToken(
    user.id,
    tokens.refreshToken,
  );

  await this.passwordResetRepository.delete({
    email: verifyOtpDto.email,
  });

  return {
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}
}
