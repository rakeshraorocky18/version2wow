import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatServiceMongodb } from './chat.service.mongodb';
import { ChatGateway } from './chat.gateway';
import {
  Message,
  MessageSchema,
  Conversation,
  ConversationSchema,
  ChatPrivacySettings,
  ChatPrivacySettingsSchema,
  ChatMeeting,
  ChatMeetingSchema,
  ChatHiddenContact,
  ChatHiddenContactSchema,
  ChatHistoryClear,
  ChatHistoryClearSchema,
} from './schemas/message.schema';
import { Match } from '../matchmaking/entities/match.entity';
import { UsersModule } from '../users/users.module';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: ChatPrivacySettings.name, schema: ChatPrivacySettingsSchema },
      { name: ChatMeeting.name, schema: ChatMeetingSchema },
      { name: ChatHiddenContact.name, schema: ChatHiddenContactSchema },
      { name: ChatHistoryClear.name, schema: ChatHistoryClearSchema },
    ]),
    TypeOrmModule.forFeature([Match], SQLITE_CONNECTION),
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatServiceMongodb, ChatGateway],
  exports: [ChatServiceMongodb],
})
export class ChatModule {}
