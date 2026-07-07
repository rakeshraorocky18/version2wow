import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HoneymoonPackageType } from '../../../common/enums';

@Entity('honeymoon_packages')
export class HoneymoonPackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  destination: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'varchar', default: HoneymoonPackageType.DOMESTIC })
  type: HoneymoonPackageType;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'int' })
  durationNights: number;

  @Column({ type: 'int' })
  durationDays: number;

  @Column({ type: 'float' })
  pricePerPerson: number;

  @Column({ type: 'float', nullable: true })
  couplePrice: number;

  @Column({ type: 'simple-array', nullable: true })
  inclusions: string[];

  @Column({ type: 'simple-array', nullable: true })
  exclusions: string[];

  @Column({ type: 'simple-array', nullable: true })
  highlights: string[];

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ nullable: true })
  hotelName: string;

  @Column({ nullable: true })
  hotelRating: string;

  @Column({ nullable: true })
  flightIncluded: boolean;

  @Column({ nullable: true })
  visaRequired: boolean;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  vendorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('honeymoon_bookings')
export class HoneymoonBookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  packageId: string;

  @Column()
  travelDate: string;

  @Column()
  returnDate: string;

  @Column({ type: 'int', default: 2 })
  travellers: number;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'varchar', default: 'requested' })
  status: string;

  @Column({ nullable: true })
  specialRequests: string;

  @Column({ nullable: true })
  passportDetails: string;

  @Column({ nullable: true, type: 'text' })
  itinerary: string; // JSON string of day-wise plan

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
