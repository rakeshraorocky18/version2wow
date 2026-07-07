import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventEntity, GuestEntity } from './entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, GuestEntity])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
