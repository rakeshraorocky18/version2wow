import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsServiceTypeorm } from './vendors.service.typeorm';
import { VendorEntity, VendorReviewEntity } from './entities/vendor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VendorEntity, VendorReviewEntity])],
  controllers: [VendorsController],
  providers: [VendorsServiceTypeorm],
  exports: [VendorsServiceTypeorm],
})
export class VendorsModule {}
