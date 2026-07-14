import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorProfileCategory } from '../../common/enums';
import { VendorProfileEntity } from './entities/vendor-profile.entity';
import { CreateVendorProfileDto, UpdateVendorProfileDto } from './dto/vendor-profile.dto';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Injectable()
export class VendorProfilesService {
  constructor(
    @InjectRepository(VendorProfileEntity, SQLITE_CONNECTION)
    private readonly repo: Repository<VendorProfileEntity>,
  ) {}

  async getByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  async getById(id: string) {
    const profile = await this.repo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Vendor profile not found');
    return profile;
  }

  async create(userId: string, dto: CreateVendorProfileDto) {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) {
      return this.update(userId, dto);
    }
    const profile = this.repo.create({ ...dto, userId });
    return this.repo.save(profile);
  }

  async update(userId: string, dto: UpdateVendorProfileDto) {
    let profile = await this.repo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.repo.create({ ...dto, userId, businessName: dto.businessName || 'Business' });
    } else {
      Object.assign(profile, dto);
    }
    return this.repo.save(profile);
  }

  async updateFile(
    userId: string,
    field: 'businessLogo' | 'businessBanner' | 'governmentIdUrl' | 'businessRegistrationUrl',
    url: string,
  ) {
    let profile = await this.repo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.repo.create({
        userId,
        businessName: 'Business',
        category: VendorProfileCategory.OTHER,
      });
    }
    profile[field] = url;
    return this.repo.save(profile);
  }

  async appendArrayField(
    userId: string,
    field: 'portfolioPhotos' | 'portfolioVideos' | 'awards' | 'certificates',
    url: string,
  ) {
    let profile = await this.repo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.repo.create({
        userId,
        businessName: 'Business',
        category: VendorProfileCategory.OTHER,
        [field]: [url],
      });
    } else {
      const current = profile[field] || [];
      profile[field] = [...current, url];
    }
    return this.repo.save(profile);
  }
}
