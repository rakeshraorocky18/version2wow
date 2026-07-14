import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoneymoonController } from './honeymoon.controller';
import { HoneymoonService } from './honeymoon.service';
import { HoneymoonPackageEntity, HoneymoonBookingEntity } from './entities/honeymoon.entity';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([HoneymoonPackageEntity, HoneymoonBookingEntity], SQLITE_CONNECTION)],
  controllers: [HoneymoonController],
  providers: [HoneymoonService],
  exports: [HoneymoonService],
})
export class HoneymoonModule {}
