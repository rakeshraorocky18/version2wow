import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../config/database.constants';
import { NotificationDeliveryLogEntity } from './entities/notification-delivery-log.entity';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'match' | 'message' | 'booking' | 'reminder' | 'system';
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationDeliveryLogEntity, POSTGRES_CONNECTION)
    private readonly deliveryLogRepo: Repository<NotificationDeliveryLogEntity>,
    @InjectRepository(Notification, POSTGRES_CONNECTION)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // TODO: Integrate with FCM/APNs for push notifications
      // TODO: Integrate with SMS/Email services
     console.log(
 `[Notification] To: ${payload.userId} - ${payload.title}: ${payload.body}`
);

// Save notification for frontend
await this.notificationRepository.save({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.body,
    isRead: false,
});

// Save delivery log
await this.deliveryLogRepo.save({
    userId: payload.userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    data: payload.data ?? null,
    status: 'sent',
    channel: 'console',
});
    
    } catch (error) {
      await this.deliveryLogRepo.save({
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data ?? null,
        status: 'failed',
        channel: 'console',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async sendBulkNotifications(payloads: NotificationPayload[]): Promise<void> {
    await Promise.all(payloads.map((p) => this.sendNotification(p)));
  }

  async sendMatchNotification(userId: string, matchName: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'New Match Interest!',
      body: `${matchName} has shown interest in your profile`,
      type: 'match',
    });
  }

  async sendMessageNotification(userId: string, senderName: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'New Message',
      body: `You have a new message from ${senderName}`,
      type: 'message',
    });
  }

  async sendReminderNotification(userId: string, taskTitle: string, dueDate: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Task Reminder',
      body: `"${taskTitle}" is due on ${dueDate}`,
      type: 'reminder',
    });
  }

  async create(dto: CreateNotificationDto) {
  return await this.notificationRepository.save(dto);
}

async findAll(userId: string) {
  return await this.notificationRepository.find({
    where: {
      userId,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async markAsRead(id: number) {
  await this.notificationRepository.update(id, {
    isRead: true,
  });
}

async unreadCount(userId: string) {
  return await this.notificationRepository.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
}
