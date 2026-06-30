import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingRange, VendorProfileCategory } from '../../../common/enums';

@Entity('vendor_profiles')
export class VendorProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ nullable: true })
  businessLogo: string;

  @Column({ nullable: true })
  businessBanner: string;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  ownerName: string;

  @Column({ type: 'varchar' })
  category: VendorProfileCategory;

  @Column({ nullable: true })
  categoryOther: string;

  @Column({ type: 'text', nullable: true })
  businessDescription: string;

  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number;

  @Column({ type: 'int', nullable: true })
  teamSize: number;

  @Column({ type: 'varchar', nullable: true })
  pricingRange: PricingRange;

  @Column({ type: 'simple-json', nullable: true })
  serviceCities: string[];

  @Column({ type: 'simple-json', nullable: true })
  serviceStates: string[];

  @Column({ nullable: true })
  businessAddress: string;

  @Column({ nullable: true })
  googleMapsLocation: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ type: 'simple-json', nullable: true })
  portfolioPhotos: string[];

  @Column({ type: 'simple-json', nullable: true })
  portfolioVideos: string[];

  @Column({ nullable: true })
  governmentIdUrl: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  businessRegistrationUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  awards: string[];

  @Column({ type: 'simple-json', nullable: true })
  certificates: string[];

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
