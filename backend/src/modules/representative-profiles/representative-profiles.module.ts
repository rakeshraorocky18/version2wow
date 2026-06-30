import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepresentativeProfileEntity } from './entities/representative-profile.entity';
import { RepresentativeProfilesController } from './representative-profiles.controller';
import { RepresentativeProfilesService } from './representative-profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([RepresentativeProfileEntity])],
  controllers: [RepresentativeProfilesController],
  providers: [RepresentativeProfilesService],
  exports: [RepresentativeProfilesService],
})
export class RepresentativeProfilesModule {}
