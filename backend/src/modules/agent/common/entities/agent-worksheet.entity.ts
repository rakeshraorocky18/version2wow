import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  WorksheetPriority,
  WorksheetTaskStatus,
} from '../enums/agent.enums';

@Entity('agent_worksheet_tasks')
export class AgentWorksheetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  agentId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: WorksheetPriority.MEDIUM })
  priority: WorksheetPriority;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  @Column({ type: 'varchar', default: WorksheetTaskStatus.PENDING })
  status: WorksheetTaskStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
