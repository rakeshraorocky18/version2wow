import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorProfileEntity } from './entities/vendor-profile.entity';
import { VendorProfilesController } from './vendor-profiles.controller';
import { VendorProfilesService } from './vendor-profiles.service';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([VendorProfileEntity], SQLITE_CONNECTION)],
  controllers: [VendorProfilesController],
  providers: [VendorProfilesService],
  exports: [VendorProfilesService],
})
export class VendorProfilesModule {}
