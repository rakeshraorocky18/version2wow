import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus, PaymentStatus, PaymentMethod } from '../../../common/enums';

@Entity('bookings')
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  vendorId!: string;

  @Column({ nullable: true })
  vendorName!: string;

  @Column({ nullable: true })
  serviceDescription!: string;

  @Column()
  eventType!: string;

  @Column({ nullable: true })
  eventTime!: string;

  @Column({ nullable: true })
  venue!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ type: 'int', default: 0 })
  guestCount!: number;

  @Column({ nullable: true })
  customerName!: string;

  @Column({ nullable: true })
  customerPhone!: string;

  @Column({ nullable: true })
  customerEmail!: string;

  @Column({ nullable: true })
  specialRequirements!: string;

  @Column()
  eventDate!: string;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ type: 'float', default: 0 })
  advancePaid!: number;

  @Column({ type: 'float', default: 0 })
  balanceDue!: number;

  @Column({ type: 'varchar', default: BookingStatus.REQUESTED })
  status!: BookingStatus;

  @Column({ nullable: true })
  vendorNotes!: string;

  @Column({ nullable: true })
  userNotes!: string;

  @Column({ nullable: true })
  cancellationReason!: string;

  @Column({ nullable: true })
  contractUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  bookingId!: string;

  @Column()
  userId!: string;

  @Column()
  vendorId!: string;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  method!: PaymentMethod;

  @Column({ nullable: true })
  transactionId!: string;

  @Column({ nullable: true })
  gatewayOrderId!: string;

  @Column({ default: false })
  isEscrow!: boolean;

  @Column({ nullable: true })
  escrowReleaseDate!: string;

  @Column({ nullable: true })
  refundReason!: string;

  @Column({ type: 'float', nullable: true })
  refundAmount!: number;

  @Column({ nullable: true })
  receiptUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
