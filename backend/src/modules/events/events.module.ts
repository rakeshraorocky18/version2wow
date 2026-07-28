import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventEntity, GuestEntity } from './entities/event.entity';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, GuestEntity], POSTGRES_CONNECTION)],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
