import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or, Equal } from 'typeorm';
import { MessageEntity, ConversationEntity } from './entities/chat.entity';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatServiceTypeorm {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<MessageEntity> {
    let conversation = await this.conversationRepository.findOne({
      where: [
        { participant1: senderId, participant2: dto.receiverId },
        { participant1: dto.receiverId, participant2: senderId },
      ],
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participant1: senderId,
        participant2: dto.receiverId,
        lastMessage: dto.content,
        lastMessageAt: new Date(),
      });
      await this.conversationRepository.save(conversation);
    } else {
      conversation.lastMessage = dto.content;
      conversation.lastMessageAt = new Date();
      await this.conversationRepository.save(conversation);
    }

    const message = this.messageRepository.create({
      senderId,
      receiverId: dto.receiverId,
      content: dto.content,
      type: dto.type || 'text',
      mediaUrl: dto.mediaUrl,
    });

    return this.messageRepository.save(message);
  }

  async getConversations(userId: string): Promise<ConversationEntity[]> {
    return this.conversationRepository.find({
      where: [
        { participant1: userId, isActive: true },
        { participant2: userId, isActive: true },
      ],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getMessages(userId: string, otherUserId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [messages, total] = await this.messageRepository.findAndCount({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { messages, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}
