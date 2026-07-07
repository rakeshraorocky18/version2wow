import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VendorEntity } from '../vendors/entities/vendor.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';

import { VendorDashboardController } from './vendor-dashboard.controller';
import { VendorDashboardService } from './vendor-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VendorEntity,
      BookingEntity,
    ]),
  ],
  controllers: [VendorDashboardController],
  providers: [VendorDashboardService],
})
export class VendorDashboardModule {}