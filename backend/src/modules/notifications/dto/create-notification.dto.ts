export class CreateNotificationDto {
  userId!: string;

  type!: string;

  title!: string;

  message!: string;

  customerId?: string;

  customerName?: string;

  profileId?: string;

  profileName?: string;

  notificationType?: string;

  action?: string;
}
