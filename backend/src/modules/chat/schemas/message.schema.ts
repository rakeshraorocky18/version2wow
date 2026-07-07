import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true, index: true })
  conversationId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'text' })
  type: string; // text, image, video, file

  @Prop()
  mediaUrl: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ required: true })
  participants: string[];

  @Prop()
  lastMessage: string;

  @Prop()
  lastMessageAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
