import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MatchStatus } from '../../../common/enums';

@Entity('matches')
@Index(['senderId', 'receiverId'], { unique: true })
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  senderId: string;

  @Column('varchar', { length: 255 })
  receiverId: string;

  @Column('varchar', { length: 50 })
  status: MatchStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  compatibilityScore: number | null;

  @Column('text', { nullable: true })
  message: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
