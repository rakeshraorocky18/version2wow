import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatServiceTypeorm } from './chat.service.typeorm';
import { ChatGateway } from './chat.gateway';
import {
  MessageEntity,
  ConversationEntity,
  ChatPrivacySettingsEntity,
  ChatMeetingEntity,
  ChatHiddenContactEntity,
  ChatHistoryClearEntity,
} from './entities/chat.entity';
import { Match } from '../matchmaking/entities/match.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      ConversationEntity,
      ChatPrivacySettingsEntity,
      ChatMeetingEntity,
      ChatHiddenContactEntity,
      ChatHistoryClearEntity,
      Match,
    ]),
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [
    { provide: 'ChatService', useClass: ChatServiceTypeorm },
    ChatServiceTypeorm,
    ChatGateway,
  ],
  exports: [ChatServiceTypeorm],
})
export class ChatModule {}
