import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationDeliveryLogEntity } from './entities/notification-delivery-log.entity';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationDeliveryLogEntity], POSTGRES_CONNECTION)],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
