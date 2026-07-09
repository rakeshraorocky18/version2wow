import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventType, RsvpStatus } from '../../../common/enums';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  planId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: EventType.OTHER })
  type: EventType;

  @Column()
  dateTime: string;

  @Column({ nullable: true })
  endTime: string;

  @Column({ nullable: true })
  venue: string;

  @Column({ nullable: true })
  venueAddress: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'upcoming' })
  status: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ type: 'float', nullable: true })
  budget: number;

  @Column({ type: 'float', default: 0 })
  spent: number;

  @Column({ type: 'int', default: 0 })
  expectedGuests: number;

  @Column({ type: 'int', default: 0 })
  confirmedGuests: number;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('guests')
export class GuestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  relation: string; // bride_side, groom_side

  @Column({ nullable: true })
  category: string; // family, friend, colleague, vip

  @Column({ type: 'int', default: 1 })
  partySize: number;

  @Column({ type: 'varchar', default: RsvpStatus.INVITED })
  rsvpStatus: RsvpStatus;

  @Column({ nullable: true })
  rsvpMessage: string;

  @Column({ nullable: true })
  tableNumber: string;

  @Column({ nullable: true })
  seatNumber: string;

  @Column({ nullable: true })
  dietaryPreference: string;

  @Column({ default: false })
  invitationSent: boolean;

  @Column({ nullable: true })
  invitationSentAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
