import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepresentativeProfileEntity } from './entities/representative-profile.entity';
import { RepresentativeProfilesController } from './representative-profiles.controller';
import { RepresentativeProfilesService } from './representative-profiles.service';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([RepresentativeProfileEntity], SQLITE_CONNECTION)],
  controllers: [RepresentativeProfilesController],
  providers: [RepresentativeProfilesService],
  exports: [RepresentativeProfilesService],
})
export class RepresentativeProfilesModule {}
