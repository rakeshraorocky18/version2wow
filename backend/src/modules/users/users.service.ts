import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile } from './schemas/profile.schema';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async createProfile(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    const profile = new this.profileModel({
      userId,
      ...createProfileDto,
    });
    return profile.save();
  }

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async getProfileById(profileId: string): Promise<Profile> {
    const profile = await this.profileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId },
      { $set: updateProfileDto },
      { new: true },
    );
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async addPhoto(userId: string, photoUrl: string): Promise<Profile> {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId },
      { $push: { photos: photoUrl } },
      { new: true },
    );
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async toggleVisibility(userId: string): Promise<Profile> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    profile.isVisible = !profile.isVisible;
    return profile.save();
  }

  async searchProfiles(filters: any, page = 1, limit = 20): Promise<{ profiles: Profile[]; total: number }> {
    const query: any = { isVisible: true };

    if (filters.gender) query.gender = filters.gender;
    if (filters.religion) query.religion = filters.religion;
    if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
    if (filters.minAge || filters.maxAge) {
      const now = new Date();
      if (filters.maxAge) {
        query.dateOfBirth = { $gte: new Date(now.getFullYear() - filters.maxAge, now.getMonth(), now.getDate()) };
      }
      if (filters.minAge) {
        query.dateOfBirth = {
          ...query.dateOfBirth,
          $lte: new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate()),
        };
      }
    }

    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      this.profileModel.find(query).skip(skip).limit(limit).exec(),
      this.profileModel.countDocuments(query),
    ]);

    return { profiles, total };
  }
}
