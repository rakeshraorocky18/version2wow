import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorProfileEntity } from './entities/vendor-profile.entity';
import { VendorProfilesController } from './vendor-profiles.controller';
import { VendorProfilesService } from './vendor-profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([VendorProfileEntity])],
  controllers: [VendorProfilesController],
  providers: [VendorProfilesService],
  exports: [VendorProfilesService],
})
export class VendorProfilesModule {}
