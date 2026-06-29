import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { Conversation } from './schemas/message.schema';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const conversationId = this.getConversationId(senderId, dto.receiverId);

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [senderId, dto.receiverId] },
    });

    if (!conversation) {
      conversation = new this.conversationModel({
        participants: [senderId, dto.receiverId],
        lastMessage: dto.content,
        lastMessageAt: new Date(),
      });
      await conversation.save();
    } else {
      conversation.lastMessage = dto.content;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    const message = new this.messageModel({
      conversationId: conversation._id,
      senderId,
      receiverId: dto.receiverId,
      content: dto.content,
      type: dto.type || 'text',
      mediaUrl: dto.mediaUrl,
    });

    return message.save();
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({ participants: userId, isActive: true })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async getMessages(
    userId: string,
    otherUserId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: Message[]; total: number }> {
    const conversation = await this.conversationModel.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return { messages: [], total: 0 };
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ conversationId: conversation._id }),
    ]);

    return { messages, total };
  }

  async markAsRead(userId: string, messageIds: string[]): Promise<void> {
    await this.messageModel.updateMany(
      { _id: { $in: messageIds }, receiverId: userId },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      receiverId: userId,
      isRead: false,
    });
  }

  private getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
}
