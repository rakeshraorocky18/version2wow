import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus, EventType } from '../../../common/enums';

@Entity('wedding_plans')
export class WeddingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  partnerName: string;

  @Column()
  weddingDate: string;

  @Column({ type: 'float', nullable: true })
  totalBudget: number;

  @Column({ type: 'float', default: 0 })
  spentAmount: number;

  @Column({ nullable: true })
  venue: string;

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('wedding_tasks')
export class WeddingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  planId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  dueDate: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('wedding_events')
export class WeddingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  planId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: EventType.OTHER })
  type: EventType;

  @Column()
  dateTime: string;

  @Column({ nullable: true })
  venue: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'float', nullable: true })
  budget: number;

  @Column({ type: 'int', default: 0 })
  guestCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
