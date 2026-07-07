import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('shortlists')
@Unique(['userId', 'profileId'])
export class Shortlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  profileId: string;

  @CreateDateColumn()
  createdAt: Date;
}
