import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AgentCustomerMatchStatus {
  RECOMMENDED = 'recommended',
  PENDING_SENT = 'pending_sent',
  PENDING_RECEIVED = 'pending_received',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
  BLOCKED = 'blocked',
  IGNORED = 'ignored',
}

@Entity('agent_customer_matches')
@Index(['customerId', 'profileId'], { unique: true })
export class AgentCustomerMatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  agentId: string;

  @Index()
  @Column()
  customerId: string;

  @Index()
  @Column()
  profileId: string;

  @Column({ type: 'varchar', default: AgentCustomerMatchStatus.RECOMMENDED })
  status: AgentCustomerMatchStatus;

  @Column({ type: 'int', nullable: true })
  compatibilityScore: number | null;

  @Column({ type: 'boolean', default: false })
  favourite: boolean;

  @Column({ type: 'boolean', default: false })
  shortlisted: boolean;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;

  @Column({ type: 'boolean', default: false })
  ignored: boolean;

  @Column({ type: 'simple-json', nullable: true })
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
  }> | null;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastActionAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
