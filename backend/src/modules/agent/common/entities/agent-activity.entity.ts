import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AgentActivityAction } from '../enums/agent.enums';

@Entity('agent_activity_logs')
export class AgentActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  agentId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ type: 'varchar' })
  action: AgentActivityAction;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
