import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../../common/enums';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AgentProfileEntity } from '../common/entities/agent-profile.entity';
import { AgentLoginDto, AgentRegisterDto } from './dto/agent-auth.dto';

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
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.AGENT,
        isVerified: true,
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

    const tokens = this.issueTokens(user);
    return {
      ...tokens,
      user: this.mapUser(user, profile),
    };
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
      name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user.email,
    };
  }
}
