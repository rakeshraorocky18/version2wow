import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController, PublicRsvpController } from './events.controller';
import { EventsService } from './events.service';
import { EventEntity, GuestEntity, InvitationEntity, RsvpResponseEntity } from './entities/event.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, GuestEntity, InvitationEntity, RsvpResponseEntity]),
    NotificationsModule,
  ],
  controllers: [EventsController, PublicRsvpController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
