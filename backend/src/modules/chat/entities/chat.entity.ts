import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMeetingStatus, ChatRestrictionMode } from '../../../common/enums';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column()
  receiverId: string;

  @Column()
  content: string;

  @Column({ default: 'text' })
  type: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  participant1: string;

  @Column()
  participant2: string;

  @Column({ type: 'varchar', nullable: true })
  lastMessage: string;

  @Column({ type: 'datetime', nullable: true })
  lastMessageAt: Date;

  @Column({ default: true })
  isActive: boolean;

  /** Messages before this time are hidden for participant1 */
  @Column({ type: 'datetime', nullable: true })
  clearedAtParticipant1: Date | null;

  /** Messages before this time are hidden for participant2 */
  @Column({ type: 'datetime', nullable: true })
  clearedAtParticipant2: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}

/** Per-user hidden chat contacts — survives refresh; cleared when user sends a new message. */
@Entity('chat_hidden_contacts')
export class ChatHiddenContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  otherUserId: string;

  @CreateDateColumn()
  hiddenAt: Date;
}

/** Per-user chat history clear — survives ID mismatches on conversation rows. */
@Entity('chat_history_clears')
export class ChatHistoryClearEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  otherUserId: string;

  @Column({ type: 'datetime' })
  clearedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('chat_privacy_settings')
export class ChatPrivacySettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ default: true })
  allowMessages: boolean;

  @Column({ default: true })
  allowMediaSharing: boolean;

  @Column({ default: true })
  allowVoiceCalls: boolean;

  @Column({ default: true })
  allowVideoCalls: boolean;

  @Column({ default: true })
  showOnlineStatus: boolean;

  @Column({ default: true })
  readReceipts: boolean;

  @Column({ type: 'varchar', default: ChatRestrictionMode.POST_MATCH })
  chatRestriction: ChatRestrictionMode;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('chat_meetings')
export class ChatMeetingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizerId: string;

  @Column()
  participantId: string;

  @Column()
  title: string;

  @Column({ type: 'datetime' })
  scheduledAt: Date;

  @Column({ nullable: true })
  durationMinutes: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'varchar', default: ChatMeetingStatus.PENDING })
  status: ChatMeetingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}