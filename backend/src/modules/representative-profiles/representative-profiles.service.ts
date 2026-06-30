import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepresentativeProfileEntity } from './entities/representative-profile.entity';
import {
  CreateRepresentativeProfileDto,
  UpdateRepresentativeProfileDto,
} from './dto/representative-profile.dto';

function calcAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

@Injectable()
export class RepresentativeProfilesService {
  constructor(
    @InjectRepository(RepresentativeProfileEntity)
    private readonly repo: Repository<RepresentativeProfileEntity>,
  ) {}

  private format(profile: RepresentativeProfileEntity) {
    return {
      ...profile,
      age: calcAge(profile.dateOfBirth),
    };
  }

  async getByUserId(userId: string) {
    const profile = await this.repo.findOne({ where: { userId } });
    return profile ? this.format(profile) : null;
  }

  async getById(id: string) {
    const profile = await this.repo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Representative profile not found');
    return this.format(profile);
  }

  async create(userId: string, dto: CreateRepresentativeProfileDto) {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) {
      return this.update(userId, dto);
    }
    const profile = this.repo.create({ ...dto, userId });
    const saved = await this.repo.save(profile);
    return this.format(saved);
  }

  async update(userId: string, dto: UpdateRepresentativeProfileDto) {
    let profile = await this.repo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.repo.create({ ...dto, userId, fullName: dto.fullName || 'Representative' });
    } else {
      Object.assign(profile, dto);
    }
    const saved = await this.repo.save(profile);
    return this.format(saved);
  }

  async updateFile(userId: string, field: 'profilePhoto' | 'governmentIdUrl' | 'relationshipProofUrl', url: string) {
    let profile = await this.repo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.repo.create({ userId, fullName: 'Representative' });
    }
    profile[field] = url;
    const saved = await this.repo.save(profile);
    return this.format(saved);
  }
}
