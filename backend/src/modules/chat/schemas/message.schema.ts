import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ChatMeetingStatus, ChatRestrictionMode } from '../../../common/enums';

export type MessageDocument = HydratedDocument<Message>;
export type ConversationDocument = HydratedDocument<Conversation>;
export type ChatPrivacySettingsDocument = HydratedDocument<ChatPrivacySettings>;
export type ChatMeetingDocument = HydratedDocument<ChatMeeting>;
export type ChatHiddenContactDocument = HydratedDocument<ChatHiddenContact>;
export type ChatHistoryClearDocument = HydratedDocument<ChatHistoryClear>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, strict: false, collection: 'messages' })
export class Message {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true, index: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'text' })
  type: string;

  @Prop()
  mediaUrl: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date })
  readAt: Date;

  /** User IDs who deleted this message for themselves only */
  @Prop({ type: [String], default: [] })
  deletedFor: string[];

  /** When set, message disappears after this time */
  @Prop({ type: Date })
  expiresAt: Date;

  createdAt?: Date;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, strict: false, collection: 'conversations' })
export class Conversation {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  participant1: string;

  @Prop({ required: true, index: true })
  participant2: string;

  @Prop()
  lastMessage: string;

  @Prop({ type: Date })
  lastMessageAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null, required: false })
  clearedAtParticipant1?: Date;

  @Prop({ type: Date, default: null, required: false })
  clearedAtParticipant2?: Date;

  createdAt?: Date;
}

@Schema({ timestamps: true, strict: false, collection: 'chat_privacy_settings' })
export class ChatPrivacySettings {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: true })
  allowMessages: boolean;

  @Prop({ default: true })
  allowMediaSharing: boolean;

  @Prop({ default: true })
  allowVoiceCalls: boolean;

  @Prop({ default: true })
  allowVideoCalls: boolean;

  @Prop({ default: true })
  showOnlineStatus: boolean;

  @Prop({ default: true })
  readReceipts: boolean;

  @Prop({ type: String, default: ChatRestrictionMode.POST_MATCH })
  chatRestriction: ChatRestrictionMode;
}

@Schema({ timestamps: true, strict: false, collection: 'chat_meetings' })
export class ChatMeeting {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  organizerId: string;

  @Prop({ required: true, index: true })
  participantId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({ type: Number })
  durationMinutes: number;

  @Prop()
  notes: string;

  @Prop({ type: String, default: ChatMeetingStatus.PENDING })
  status: ChatMeetingStatus;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, strict: false, collection: 'chat_hidden_contacts' })
export class ChatHiddenContact {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  otherUserId: string;

  hiddenAt?: Date;
}

@Schema({ timestamps: true, strict: false, collection: 'chat_history_clears' })
export class ChatHistoryClear {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  otherUserId: string;

  @Prop({ type: Date, required: true })
  clearedAt: Date;
}

@Schema({ timestamps: true, strict: false, collection: 'chat_thread_settings' })
export class ChatThreadSettings {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  otherUserId: string;

  @Prop({ default: false })
  muted: boolean;

  /** 0 = off; otherwise seconds until messages expire for new sends */
  @Prop({ type: Number, default: 0 })
  disappearingSeconds: number;
}

export type ChatThreadSettingsDocument = HydratedDocument<ChatThreadSettings>;

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ senderId: 1, receiverId: 1, deletedFor: 1, expiresAt: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, senderId: 1, deletedFor: 1, expiresAt: 1, createdAt: 1 });
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
export const ChatPrivacySettingsSchema = SchemaFactory.createForClass(ChatPrivacySettings);
export const ChatMeetingSchema = SchemaFactory.createForClass(ChatMeeting);
export const ChatHiddenContactSchema = SchemaFactory.createForClass(ChatHiddenContact);
export const ChatHistoryClearSchema = SchemaFactory.createForClass(ChatHistoryClear);
export const ChatThreadSettingsSchema = SchemaFactory.createForClass(ChatThreadSettings);
