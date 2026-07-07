import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatServiceTypeorm } from './chat.service.typeorm';
import { ChatGateway } from './chat.gateway';
import { MessageEntity, ConversationEntity } from './entities/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, ConversationEntity])],
  controllers: [ChatController],
  providers: [
    { provide: 'ChatService', useClass: ChatServiceTypeorm },
    ChatServiceTypeorm,
    ChatGateway,
  ],
  exports: [ChatServiceTypeorm],
})
export class ChatModule {}
