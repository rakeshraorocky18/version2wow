import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../auth/entities/user.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { UserRole } from '../../common/enums';
import { VendorRegisterDto } from './dto/vendor-auth.dto';

import { JwtService } from '@nestjs/jwt';
import { VendorLoginDto } from './dto/vendor-auth.dto';


@Injectable()
export class VendorAuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(VendorEntity)
    private vendorRepository: Repository<VendorEntity>,

    private jwtService: JwtService,
  ) {}

  async register(dto: VendorRegisterDto) {
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.save({
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: UserRole.VENDOR,
    });

    const vendor = await this.vendorRepository.save({
      userId: user.id,
      businessName: dto.businessName,
      email: dto.email,
      phone: dto.phone,
      category: dto.category,
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Vendor registered successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessName: vendor.businessName,
      },
    };
  }

    async login(dto: VendorLoginDto) {

      const user = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      if (user.role !== UserRole.VENDOR) {
        throw new UnauthorizedException("Not a vendor account");
      }

      const valid = await bcrypt.compare(
        dto.password,
        user.password,
      );

      if (!valid) {
        throw new UnauthorizedException("Invalid credentials");
      }


      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      const vendor = await this.vendorRepository.findOne({
        where: { userId: user.id },
      });

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          businessName: vendor?.businessName ?? "",
        },
      };
    }
}