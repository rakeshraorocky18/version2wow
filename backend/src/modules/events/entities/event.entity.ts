import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventType, RsvpStatus, InvitationChannel, InvitationStatus } from '../../../common/enums';

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

@Entity('invitations')
export class InvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  guestId: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', default: InvitationChannel.DIGITAL_LINK })
  channel: InvitationChannel;

  @Column({ type: 'varchar', default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Column({ unique: true })
  rsvpToken: string;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true })
  sentAt: string;

  @Column({ nullable: true })
  openedAt: string;

  @Column({ nullable: true })
  respondedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('rsvps')
export class RsvpResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  guestId: string;

  @Column({ nullable: true })
  invitationId: string;

  @Column({ type: 'varchar' })
  rsvpStatus: RsvpStatus;

  @Column({ nullable: true })
  rsvpMessage: string;

  @Column({ type: 'int', default: 1 })
  attendingCount: number;

  @Column({ nullable: true })
  respondedVia: string; // link, host

  @CreateDateColumn()
  createdAt: Date;
}
