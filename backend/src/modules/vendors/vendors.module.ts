import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsServiceTypeorm } from './vendors.service.typeorm';
import { VendorEntity, VendorReviewEntity } from './entities/vendor.entity';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([VendorEntity, VendorReviewEntity], SQLITE_CONNECTION)],
  controllers: [VendorsController],
  providers: [VendorsServiceTypeorm],
  exports: [VendorsServiceTypeorm],
})
export class VendorsModule {}
