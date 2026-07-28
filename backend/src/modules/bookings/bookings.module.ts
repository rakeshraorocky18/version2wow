import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingEntity, PaymentEntity } from './entities/booking.entity';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity, PaymentEntity], POSTGRES_CONNECTION)],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
