import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VendorEntity } from '../vendors/entities/vendor.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';

import { VendorDashboardController } from './vendor-dashboard.controller';
import { VendorDashboardService } from './vendor-dashboard.service';
import { SQLITE_CONNECTION, POSTGRES_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorEntity], SQLITE_CONNECTION),
    TypeOrmModule.forFeature([BookingEntity], POSTGRES_CONNECTION),
  ],
  controllers: [VendorDashboardController],
  providers: [VendorDashboardService],
})
export class VendorDashboardModule {}