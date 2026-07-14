import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../config/database.constants';
import { NotificationDeliveryLogEntity } from './entities/notification-delivery-log.entity';

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
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // TODO: Integrate with FCM/APNs for push notifications
      // TODO: Integrate with SMS/Email services
      console.log(`[Notification] To: ${payload.userId} - ${payload.title}: ${payload.body}`);

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
}
