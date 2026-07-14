import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgentCustomerStatus } from '../enums/agent.enums';

@Entity('agent_customers')
export class AgentCustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  customerCode: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  gender: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  religion: string;

  @Column({ nullable: true })
  caste: string;

  @Column({ nullable: true })
  motherTongue: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  education: string;

  @Column({ type: 'simple-json', nullable: true })
  personalDetails: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  familyDetails: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  educationDetails: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  religionDetails: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  partnerPreferences: Record<string, unknown>;

  @Column({ type: 'varchar', default: AgentCustomerStatus.PENDING })
  status: AgentCustomerStatus;

  @Column({ type: 'int', default: 0 })
  profileCompletion: number;

  @Index()
  @Column()
  assignedAgentId: string;

  @Column()
  createdByAgentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
