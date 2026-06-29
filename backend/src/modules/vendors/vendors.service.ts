import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vendor, VendorReview } from './schemas/vendor.schema';
import { CreateVendorDto, CreateReviewDto } from './dto/vendor.dto';
import { VendorCategory } from '../../common/enums';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(VendorReview.name) private reviewModel: Model<VendorReview>,
  ) {}

  async createVendor(userId: string, dto: CreateVendorDto): Promise<Vendor> {
    const vendor = new this.vendorModel({ userId, ...dto, rating: { average: 0, count: 0 } });
    return vendor.save();
  }

  async getVendorById(id: string): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateVendor(userId: string, vendorId: string, dto: Partial<CreateVendorDto>): Promise<Vendor> {
    const vendor = await this.vendorModel.findOneAndUpdate(
      { _id: vendorId, userId },
      { $set: dto },
      { new: true },
    );
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async searchVendors(filters: {
    category?: VendorCategory;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    search?: string;
  }, page = 1, limit = 20) {
    const query: any = { isActive: true };

    if (filters.category) query.category = filters.category;
    if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
    if (filters.minPrice) query['pricing.startingPrice'] = { $gte: filters.minPrice };
    if (filters.maxPrice) {
      query['pricing.startingPrice'] = {
        ...query['pricing.startingPrice'],
        $lte: filters.maxPrice,
      };
    }
    if (filters.minRating) query['rating.average'] = { $gte: filters.minRating };
    if (filters.search) {
      query.$or = [
        { businessName: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
        { services: { $in: [new RegExp(filters.search, 'i')] } },
      ];
    }

    const skip = (page - 1) * limit;
    const [vendors, total] = await Promise.all([
      this.vendorModel.find(query).sort({ isFeatured: -1, 'rating.average': -1 }).skip(skip).limit(limit).exec(),
      this.vendorModel.countDocuments(query),
    ]);

    return { vendors, total, page, totalPages: Math.ceil(total / limit) };
  }

  async addReview(userId: string, vendorId: string, dto: CreateReviewDto): Promise<VendorReview> {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const review = new this.reviewModel({ vendorId, userId, ...dto });
    await review.save();

    // Update vendor rating
    const reviews = await this.reviewModel.find({ vendorId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    vendor.rating = { average: Math.round(avgRating * 10) / 10, count: reviews.length };
    await vendor.save();

    return review;
  }

  async getReviews(vendorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.reviewModel.find({ vendorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.reviewModel.countDocuments({ vendorId }),
    ]);
    return { reviews, total };
  }

  async getFeaturedVendors(category?: VendorCategory): Promise<Vendor[]> {
    const query: any = { isActive: true, isFeatured: true };
    if (category) query.category = category;
    return this.vendorModel.find(query).limit(10).exec();
  }
}
