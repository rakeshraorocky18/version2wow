import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification_delivery_logs')
export class NotificationDeliveryLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column()
  type: string;

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ default: 'sent' })
  status: string;

  @Column({ nullable: true })
  channel: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
