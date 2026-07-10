import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingStatus } from '../../common/enums';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { SQLITE_CONNECTION, POSTGRES_CONNECTION } from '../../config/database.constants';

@Injectable()
export class VendorDashboardService {
  constructor(
    @InjectRepository(VendorEntity, SQLITE_CONNECTION)
    private vendorRepository: Repository<VendorEntity>,

    @InjectRepository(BookingEntity, POSTGRES_CONNECTION)
    private bookingRepository: Repository<BookingEntity>,
  ) {}

  async getDashboard(userId: string) {
    const vendor = await this.vendorRepository.findOne({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const pendingBookings = await this.bookingRepository.count({
      where: {
        vendorId: vendor.id,
        status: BookingStatus.REQUESTED,
      },
    });

    const confirmedBookings = await this.bookingRepository.count({
      where: {
        vendorId: vendor.id,
        status: BookingStatus.CONFIRMED,
      },
    });

    const recentBookings = await this.bookingRepository.find({
      where: {
        vendorId: vendor.id,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });

    return {
      pendingBookings,
      confirmedBookings,
      averageRating: vendor.ratingAverage,
      reviews: vendor.ratingCount,
      recentBookings,
    };
  }
  }