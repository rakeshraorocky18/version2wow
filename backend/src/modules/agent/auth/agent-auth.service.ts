import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../../common/enums';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AgentProfileEntity } from '../common/entities/agent-profile.entity';
import { AgentLoginDto, AgentRegisterDto, UpdateAgentProfileDto, ChangeAgentPasswordDto } from './dto/agent-auth.dto';

@Injectable()
export class AgentAuthService {
  constructor(
    @InjectRepository(User, POSTGRES_CONNECTION)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AgentProfileEntity, POSTGRES_CONNECTION)
    private readonly agentProfileRepo: Repository<AgentProfileEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: AgentRegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      if (exists.isActive) {
        throw new ConflictException('Email already exists');
      }
      
      // Reactivate deactivated user
      exists.password = await bcrypt.hash(dto.password, 10);
      exists.phone = dto.phone ?? '';
      exists.isActive = true;
      exists.isVerified = true;
      exists.lastLoginAt = new Date();
      const updatedUser = await this.userRepo.save(exists);

      let profile = await this.agentProfileRepo.findOne({
        where: { userId: exists.id },
      });
      if (!profile) {
        profile = this.agentProfileRepo.create({
          userId: exists.id,
          firstName: dto.firstName,
          lastName: dto.lastName ?? '',
          phone: dto.phone ?? '',
          employeeCode: dto.employeeCode ?? '',
        });
      } else {
        profile.firstName = dto.firstName;
        profile.lastName = dto.lastName ?? '';
        profile.phone = dto.phone ?? '';
        profile.employeeCode = dto.employeeCode ?? '';
      }
      const updatedProfile = await this.agentProfileRepo.save(profile);

      const tokens = this.issueTokens(updatedUser);
      return {
        message: 'Agent registered and reactivated successfully',
        ...tokens,
        user: this.mapUser(updatedUser, updatedProfile),
      };
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.AGENT,
        isVerified: true,
        lastLoginAt: new Date(),
      }),
    );

    const profile = await this.agentProfileRepo.save(
      this.agentProfileRepo.create({
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        employeeCode: dto.employeeCode,
      }),
    );

    const tokens = this.issueTokens(user);
    return {
      message: 'Agent registered successfully',
      ...tokens,
      user: this.mapUser(user, profile),
    };
  }

  async login(dto: AgentLoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || user.role !== UserRole.AGENT) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    const savedUser = await this.userRepo.save(user);

    let profile = await this.agentProfileRepo.findOne({
      where: { userId: user.id },
    });
    if (!profile) {
      profile = await this.agentProfileRepo.save(
        this.agentProfileRepo.create({
          userId: user.id,
          firstName: user.email.split('@')[0],
        }),
      );
    }

    const tokens = this.issueTokens(savedUser);
    return {
      ...tokens,
      user: this.mapUser(savedUser, profile),
    };
  }

  async deactivate(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.AGENT) {
      throw new UnauthorizedException('Not an agent account');
    }
    user.isActive = false;
    await this.userRepo.save(user);
    return { message: 'Account deactivated successfully' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.AGENT) {
      throw new UnauthorizedException('Not an agent account');
    }
    const profile = await this.agentProfileRepo.findOne({
      where: { userId },
    });
    return this.mapUser(user, profile);
  }

  async updateProfile(userId: string, dto: UpdateAgentProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.AGENT) {
      throw new UnauthorizedException('Not an agent account');
    }
    let profile = await this.agentProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.agentProfileRepo.create({ userId, firstName: dto.firstName ?? '' });
    }
    if (dto.firstName !== undefined) profile.firstName = dto.firstName;
    if (dto.lastName !== undefined) profile.lastName = dto.lastName;
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.profileImageUrl !== undefined) profile.profileImageUrl = dto.profileImageUrl;
    await this.agentProfileRepo.save(profile);
    return this.mapUser(user, profile);
  }

  async updateProfilePhoto(userId: string, fileUrl: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.AGENT) {
      throw new UnauthorizedException('Not an agent account');
    }
    let profile = await this.agentProfileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.agentProfileRepo.create({ userId, firstName: user.email.split('@')[0] });
    }
    profile.profileImageUrl = fileUrl;
    await this.agentProfileRepo.save(profile);
    return this.mapUser(user, profile);
  }

  async changePassword(userId: string, dto: ChangeAgentPasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.AGENT) {
      throw new UnauthorizedException('Not an agent account');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
    return { message: 'Password updated successfully' };
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }

  private mapUser(user: User, profile?: AgentProfileEntity | null) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? user.phone ?? '',
      employeeCode: profile?.employeeCode ?? '',
      profileImageUrl: profile?.profileImageUrl ?? null,
      name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
