import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { POSTGRES_CONNECTION } from '../../config/database.constants';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

import { Notification } from './entities/notification.entity';
import { NotificationDeliveryLogEntity } from './entities/notification-delivery-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Notification,
        NotificationDeliveryLogEntity,
      ],
      POSTGRES_CONNECTION,
    ),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}