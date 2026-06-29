import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepository: Repository<ProfileEntity>,
  ) {}

  async createProfile(userId: string, dto: CreateProfileDto): Promise<ProfileEntity> {
    // Upsert: if profile exists, update it instead of failing
    const existing = await this.profileRepository.findOne({ where: { userId } });
    if (existing) {
      return this.updateProfile(userId, dto);
    }

    const profile = this.profileRepository.create({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      religion: dto.religion,
      caste: dto.caste,
      motherTongue: dto.motherTongue,
      education: dto.education,
      occupation: dto.occupation,
      income: dto.income,
      height: dto.height,
      city: dto.location?.city,
      state: dto.location?.state,
      country: dto.location?.country || 'India',
      bio: dto.bio,
      interests: dto.interests,
    });
    return this.profileRepository.save(profile);
  }

  async getProfile(userId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getProfileById(profileId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileEntity> {
    const profile = await this.getProfile(userId);
    Object.assign(profile, {
      ...dto,
      city: dto.location?.city ?? profile.city,
      state: dto.location?.state ?? profile.state,
      country: dto.location?.country ?? profile.country,
    });
    return this.profileRepository.save(profile);
  }

  async searchProfiles(filters: any, page = 1, limit = 20) {
    const where: any = { isVisible: true };
    if (filters.gender) where.gender = filters.gender;
    if (filters.religion) where.religion = filters.religion;
    if (filters.city) where.city = Like(`%${filters.city}%`);

    const skip = (page - 1) * limit;
    const [profiles, total] = await this.profileRepository.findAndCount({
      where,
      skip,
      take: limit,
    });

    return { profiles, total };
  }
}
