import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('aadhaar_verifications')
export class AadhaarVerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  aadhaarHash?: string;

  @Column({ nullable: true })
  maskedAadhaar?: string;

  @Column({ nullable: true })
  otp?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  agentId?: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
