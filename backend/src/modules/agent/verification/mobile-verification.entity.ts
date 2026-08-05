import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('mobile_verifications')
export class MobileVerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  mobile!: string;

  @Column()
  otp!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date | null;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column()
  sessionId!: string;

  @Column({ nullable: true })
  agentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
