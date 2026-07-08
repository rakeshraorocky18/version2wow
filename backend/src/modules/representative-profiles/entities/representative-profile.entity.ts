import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ManagingProfileFor,
  RepresentativeRelationship,
} from '../../../common/enums';

@Entity('representative_profiles')
export class RepresentativeProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  companyOrganization: string;

  @Column({ type: 'simple-json', nullable: true })
  languagesKnown: string[];

  @Column({ type: 'varchar', nullable: true })
  relationship: RepresentativeRelationship;

  @Column({ nullable: true })
  relationshipOther: string;

  @Column({ type: 'varchar', nullable: true })
  managingProfileFor: ManagingProfileFor;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ default: false })
  allowPhoneCalls: boolean;

  @Column({ default: false })
  allowWhatsApp: boolean;

  @Column({ default: false })
  allowEmail: boolean;

  @Column({ nullable: true })
  governmentIdUrl: string;

  @Column({ nullable: true })
  relationshipProofUrl: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
