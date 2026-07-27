import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  MessageEntity,
  ConversationEntity,
  ChatPrivacySettingsEntity,
  ChatMeetingEntity,
  ChatHiddenContactEntity,
  ChatHistoryClearEntity,
} from './entities/chat.entity';
import {
  SendMessageDto,
  UpdateChatPrivacyDto,
  ScheduleMeetingDto,
} from './dto/chat.dto';
import { MatchStatus, ChatRestrictionMode, ChatMeetingStatus } from '../../common/enums';
import { UsersService } from '../users/users.service.typeorm';
import { SQLITE_CONNECTION } from '../../config/database.constants';

@Injectable()
export class ChatServiceTypeorm {
  constructor(
    @InjectRepository(MessageEntity, SQLITE_CONNECTION)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity, SQLITE_CONNECTION)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ChatPrivacySettingsEntity, SQLITE_CONNECTION)
    private privacyRepository: Repository<ChatPrivacySettingsEntity>,
    @InjectRepository(ChatMeetingEntity, SQLITE_CONNECTION)
    private meetingRepository: Repository<ChatMeetingEntity>,
    @InjectRepository(ChatHiddenContactEntity, SQLITE_CONNECTION)
    private hiddenContactRepository: Repository<ChatHiddenContactEntity>,
    @InjectRepository(ChatHistoryClearEntity, SQLITE_CONNECTION)
    private historyClearRepository: Repository<ChatHistoryClearEntity>,
    // matchmaking DB access removed for main portal; assume no direct matches here
    private usersService: UsersService,
  ) {}

  private async resolveUserId(idOrUserId: string): Promise<string> {
    try {
      const profile = await this.usersService.getProfileByIdOrUserId(idOrUserId);
      return profile.userId;
    } catch {
      return idOrUserId;
    }
  }

  private async getHiddenUserIds(userId: string): Promise<Set<string>> {
    try {
      const resolvedUserId = await this.resolveUserId(userId);
      const rows = await this.hiddenContactRepository.find({
        where: [{ userId: resolvedUserId }, { userId }],
      });
      const hidden = new Set<string>();
      for (const row of rows) {
        hidden.add(row.otherUserId);
        const resolvedOther = await this.resolveUserId(row.otherUserId);
        hidden.add(resolvedOther);
        const profile = await this.usersService.getProfileOrNull(resolvedOther);
        if (profile?.id) hidden.add(profile.id);
      }
      return hidden;
    } catch {
      return new Set();
    }
  }

  async getHiddenContactIds(userId: string): Promise<string[]> {
    return Array.from(await this.getHiddenUserIds(userId));
  }

  private async findAcceptedMatchesForUser(_userId: string): Promise<any[]> {
    // main portal doesn't track matchmaking here; return empty
    return [];
  }

  private partnerIdFromMatch(match: any, selfIds: Set<string>): string {
    return selfIds.has(match.senderId) ? match.receiverId : match.senderId;
  }

  private async getSelfIds(userId: string): Promise<Set<string>> {
    const resolved = await this.resolveUserId(userId);
    const profile = await this.usersService.getProfileOrNull(resolved);
    const ids = new Set([userId, resolved]);
    if (profile?.id) ids.add(profile.id);
    return ids;
  }

  async isContactHidden(userId: string, otherUserId: string): Promise<boolean> {
    const hidden = await this.getHiddenUserIds(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    return hidden.has(otherUserId) || hidden.has(resolvedOther);
  }

  private async findConversation(
    userId: string,
    otherUserId: string,
  ): Promise<ConversationEntity | null> {
    const selfIds = await this.getSelfIds(userId);
    const otherIds = await this.getSelfIds(otherUserId);
    const selfIdList = Array.from(selfIds);
    const conversations = await this.conversationRepository.find({
      where: [
        { participant1: In(selfIdList) },
        { participant2: In(selfIdList) },
      ],
    });
    return (
      conversations.find(
        (c) =>
          (selfIds.has(c.participant1) && otherIds.has(c.participant2)) ||
          (selfIds.has(c.participant2) && otherIds.has(c.participant1)),
      ) || null
    );
  }

  private latestClearDate(...dates: Array<Date | null | undefined>): Date | null {
    const valid = dates.filter((d): d is Date => d instanceof Date);
    if (!valid.length) return null;
    return valid.reduce((latest, d) => (d > latest ? d : latest));
  }

  private async getHistoryClearedAt(userId: string, otherUserId: string): Promise<Date | null> {
    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    const row = await this.historyClearRepository.findOne({
      where: { userId: resolvedUser, otherUserId: resolvedOther },
    });
    return row?.clearedAt ?? null;
  }

  private async setHistoryClearedAt(userId: string, otherUserId: string): Promise<void> {
    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    const now = new Date();
    let row = await this.historyClearRepository.findOne({
      where: { userId: resolvedUser, otherUserId: resolvedOther },
    });
    if (row) {
      row.clearedAt = now;
    } else {
      row = this.historyClearRepository.create({
        userId: resolvedUser,
        otherUserId: resolvedOther,
        clearedAt: now,
      });
    }
    await this.historyClearRepository.save(row);
  }

  private async getEffectiveClearedAt(
    userId: string,
    otherUserId: string,
    conv: ConversationEntity | null,
  ): Promise<Date | null> {
    const historyClearedAt = await this.getHistoryClearedAt(userId, otherUserId);
    const convClearedAt = conv ? await this.getClearedAtForUser(conv, userId) : null;
    return this.latestClearDate(historyClearedAt, convClearedAt);
  }

  private async isParticipantSlot1(
    conv: ConversationEntity,
    userId: string,
  ): Promise<boolean> {
    const selfIds = await this.getSelfIds(userId);
    return selfIds.has(conv.participant1);
  }

  private async getClearedAtForUser(
    conv: ConversationEntity,
    userId: string,
  ): Promise<Date | null> {
    return (await this.isParticipantSlot1(conv, userId))
      ? conv.clearedAtParticipant1
      : conv.clearedAtParticipant2;
  }

  private async setClearedAtForUser(conv: ConversationEntity, userId: string): Promise<void> {
    const now = new Date();
    if (await this.isParticipantSlot1(conv, userId)) {
      conv.clearedAtParticipant1 = now;
    } else {
      conv.clearedAtParticipant2 = now;
    }
  }

  private async hideContact(userId: string, otherUserId: string): Promise<void> {
    const resolvedUserId = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    const existing = await this.hiddenContactRepository.findOne({
      where: { userId: resolvedUserId, otherUserId: resolvedOther },
    });
    if (!existing) {
      await this.hiddenContactRepository.save(
        this.hiddenContactRepository.create({
          userId: resolvedUserId,
          otherUserId: resolvedOther,
        }),
      );
    }
  }

  private async unhideContact(userId: string, otherUserId: string): Promise<void> {
    const resolvedUserId = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    await this.hiddenContactRepository.delete({
      userId: resolvedUserId,
      otherUserId: resolvedOther,
    });
  }
  async hasAcceptedMatch(userA: string, userB: string): Promise<boolean> {
    const resolvedB = await this.resolveUserId(userB);
    const profileB = await this.usersService.getProfileOrNull(resolvedB);
    const bIds = new Set([userB, resolvedB]);
    if (profileB?.id) bIds.add(profileB.id);

    const matches = await this.findAcceptedMatchesForUser(userA);
    const resolvedA = await this.resolveUserId(userA);
    const profileA = await this.usersService.getProfileOrNull(resolvedA);
    const aIds = new Set([userA, resolvedA]);
    if (profileA?.id) aIds.add(profileA.id);

    for (const match of matches) {
      const rawPartner = this.partnerIdFromMatch(match, aIds);
      const partnerId = await this.resolveUserId(rawPartner);
      if (bIds.has(rawPartner) || bIds.has(partnerId)) return true;
    }
    return false;
  }

  private async assertCanChat(senderId: string, receiverId: string): Promise<void> {
    const receiverPrivacy = await this.getPrivacySettings(receiverId);
    if (!receiverPrivacy.allowMessages) {
      throw new ForbiddenException('This user is not accepting messages right now');
    }

    const hasMatch = await this.hasAcceptedMatch(senderId, receiverId);
    if (!hasMatch) {
      throw new ForbiddenException(
        'Chat is only available after a mutual match. Send and accept an interest first.',
      );
    }
  }

  private async assertMediaAllowed(senderId: string, receiverId: string): Promise<void> {
    const receiverPrivacy = await this.getPrivacySettings(receiverId);
    if (!receiverPrivacy.allowMediaSharing) {
      throw new ForbiddenException('This user has disabled media sharing');
    }
  }

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<MessageEntity> {
    await this.assertCanChat(senderId, dto.receiverId);

    if (dto.type && dto.type !== 'text') {
      await this.assertMediaAllowed(senderId, dto.receiverId);
    }

    await this.unhideContact(senderId, dto.receiverId);

    const resolvedSender = senderId;
    const resolvedReceiver = dto.receiverId;

    let conversation = await this.findConversation(senderId, dto.receiverId);

    if (conversation && !conversation.isActive) {
      conversation.isActive = true;
    }

    const preview =
      dto.type === 'image'
        ? '📷 Photo'
        : dto.type === 'video'
          ? '🎬 Video'
          : dto.type === 'file'
            ? '📎 File'
            : dto.content;

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participant1: resolvedSender,
        participant2: resolvedReceiver,
        lastMessage: preview,
        lastMessageAt: new Date(),
        isActive: true,
      });
      await this.conversationRepository.save(conversation);
    } else {
      conversation.lastMessage = preview;
      conversation.lastMessageAt = new Date();
      await this.conversationRepository.save(conversation);
    }

    const message = this.messageRepository.create({
      senderId: resolvedSender,
      receiverId: resolvedReceiver,
      content: dto.content,
      type: dto.type || 'text',
      mediaUrl: dto.mediaUrl,
    });

    return this.messageRepository.save(message);
  }

  async getConversations(userId: string) {
    return this.getChatContacts(userId);
  }

  async getChatContacts(userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const profile = await this.usersService.getProfileOrNull(resolvedUserId);
    const selfIds = new Set([userId, resolvedUserId]);
    if (profile?.id) selfIds.add(profile.id);

    const matches = await this.findAcceptedMatchesForUser(userId);

    const selfIdList = Array.from(selfIds);
    const conversations = await this.conversationRepository.find({
      where: [
        { participant1: In(selfIdList) },
        { participant2: In(selfIdList) },
      ],
    });

    const convByOther = new Map<string, ConversationEntity>();
    for (const conv of conversations) {
      const rawOther = selfIds.has(conv.participant1) ? conv.participant2 : conv.participant1;
      const otherId = await this.resolveUserId(rawOther);
      convByOther.set(otherId, conv);
      convByOther.set(rawOther, conv);
    }

    const contacts: Array<{
      userId: string;
      name: string;
      subtitle: string;
      photo?: string;
      lastMessageAt?: Date;
    }> = [];

    const seenPartners = new Set<string>();

    for (const match of matches) {
      const rawPartner = this.partnerIdFromMatch(match, selfIds);
      const partnerUserId = await this.resolveUserId(rawPartner);
      if (seenPartners.has(partnerUserId)) continue;
      seenPartners.add(partnerUserId);

      const partnerProfile = await this.usersService.getProfileOrNull(partnerUserId);
      const wizard = (partnerProfile?.wizardProfile || {}) as Record<string, unknown>;
      const pd = (wizard.personalDetails || {}) as Record<string, string>;
      const firstName = pd.firstName || partnerProfile?.firstName || '';
      const lastName = pd.lastName || partnerProfile?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || 'Mutual match';
      const photo =
        (wizard.profilePhoto as string) ||
        partnerProfile?.photos?.[0] ||
        '';

      const conv = convByOther.get(partnerUserId) || convByOther.get(rawPartner);
      const clearedAt = await this.getEffectiveClearedAt(userId, partnerUserId, conv ?? null);
      contacts.push({
        userId: partnerUserId,
        name,
        subtitle: clearedAt
          ? 'Mutual match — say hello!'
          : conv?.lastMessage || 'Mutual match — say hello!',
        photo: photo || undefined,
        lastMessageAt: clearedAt ? match.updatedAt : conv?.lastMessageAt || match.updatedAt,
      });
    }

    contacts.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

    return contacts;
  }

  async getMessages(userId: string, otherUserId: string, page = 1, limit = 50) {
    const canView = await this.hasAcceptedMatch(userId, otherUserId);
    if (!canView) {
      throw new ForbiddenException('You can only view messages with accepted matches');
    }

    const conv = await this.findConversation(userId, otherUserId);
    const clearedAfter = await this.getEffectiveClearedAt(userId, otherUserId, conv);

    const selfIds = await this.getSelfIds(userId);
    const otherIds = await this.getSelfIds(otherUserId);

    const skip = (page - 1) * limit;
    const rawMessages = await this.messageRepository.find({
      order: { createdAt: 'DESC' },
    });

    const messages = rawMessages.filter((m) => {
      const senderOk = selfIds.has(m.senderId);
      const receiverOk = otherIds.has(m.receiverId);
      const senderOkRev = otherIds.has(m.senderId);
      const receiverOkRev = selfIds.has(m.receiverId);
      const isPair = (senderOk && receiverOk) || (senderOkRev && receiverOkRev);
      if (!isPair) return false;
      if (clearedAfter && new Date(m.createdAt).getTime() <= clearedAfter.getTime()) return false;
      return true;
    });

    const pageMessages = messages.slice(skip, skip + limit);
    return { messages: pageMessages, total: messages.length, cleared: !!clearedAfter };
  }

  private messagePreview(message: MessageEntity | null): string | null {
    if (!message) return null;
    if (message.type === 'image') return '📷 Photo';
    if (message.type === 'video') return '🎬 Video';
    if (message.type === 'file') return '📎 File';
    return message.content;
  }

  async deleteMessage(userId: string, messageId: string): Promise<{ success: boolean }> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const resolvedUser = await this.resolveUserId(userId);
    if (message.senderId !== userId && message.senderId !== resolvedUser) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const senderResolved = await this.resolveUserId(message.senderId);
    const receiverResolved = await this.resolveUserId(message.receiverId);
    const canDeleteInChat =
      (await this.hasAcceptedMatch(userId, senderResolved)) ||
      (await this.hasAcceptedMatch(userId, receiverResolved));
    if (!canDeleteInChat) {
      throw new ForbiddenException('You can only delete messages from matched chats');
    }

    await this.messageRepository.delete({ id: message.id });

    const conversation = await this.findConversation(senderResolved, receiverResolved);
    if (conversation) {
      const latest = await this.messageRepository.findOne({
        where: [
          { senderId: senderResolved, receiverId: receiverResolved },
          { senderId: receiverResolved, receiverId: senderResolved },
        ],
        order: { createdAt: 'DESC' },
      });
      conversation.lastMessage = this.messagePreview(latest) ?? '';
      conversation.lastMessageAt = latest?.createdAt ?? new Date(0);
      await this.conversationRepository.save(conversation);
    }

    return { success: true };
  }

  async deleteConversation(userId: string, otherUserId: string): Promise<{ success: boolean }> {
    const canDelete = await this.hasAcceptedMatch(userId, otherUserId);
    if (!canDelete) {
      throw new ForbiddenException('You can only delete chats with accepted matches');
    }

    await this.unhideContact(userId, otherUserId);
    await this.setHistoryClearedAt(userId, otherUserId);

    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);

    let conversation = await this.findConversation(userId, otherUserId);

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participant1: resolvedUser,
        participant2: resolvedOther,
        isActive: false,
        clearedAtParticipant1: new Date(),
      });
    } else {
      await this.setClearedAtForUser(conversation, userId);
      conversation.isActive = false;
    }

    await this.conversationRepository.save(conversation);
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async getPrivacySettings(userId: string): Promise<ChatPrivacySettingsEntity> {
    let settings = await this.privacyRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.privacyRepository.create({
        userId,
        chatRestriction: ChatRestrictionMode.POST_MATCH,
      });
      await this.privacyRepository.save(settings);
    }
    return settings;
  }

  async updatePrivacySettings(
    userId: string,
    dto: UpdateChatPrivacyDto,
  ): Promise<ChatPrivacySettingsEntity> {
    const settings = await this.getPrivacySettings(userId);
    if (dto.chatRestriction === ChatRestrictionMode.PRE_MATCH) {
      throw new BadRequestException('Pre-match chat is not enabled yet. Only post-match chat is available.');
    }
    Object.assign(settings, dto);
    return this.privacyRepository.save(settings);
  }

  async scheduleMeeting(
    organizerId: string,
    dto: ScheduleMeetingDto,
  ): Promise<ChatMeetingEntity> {
    await this.assertCanChat(organizerId, dto.participantId);

    const meeting = this.meetingRepository.create({
      organizerId,
      participantId: dto.participantId,
      title: dto.title,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes || 30,
      notes: dto.notes,
      status: ChatMeetingStatus.PENDING,
    });

    return this.meetingRepository.save(meeting);
  }

  async getMeetings(userId: string): Promise<ChatMeetingEntity[]> {
    return this.meetingRepository.find({
      where: [{ organizerId: userId }, { participantId: userId }],
      order: { scheduledAt: 'ASC' },
    });
  }

  async updateMeetingStatus(
    userId: string,
    meetingId: string,
    status: ChatMeetingStatus,
  ): Promise<ChatMeetingEntity> {
    const meeting = await this.meetingRepository.findOne({ where: { id: meetingId } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    if (meeting.organizerId !== userId && meeting.participantId !== userId) {
      throw new ForbiddenException('You are not part of this meeting');
    }
    meeting.status = status;
    return this.meetingRepository.save(meeting);
  }

  async canInitiateCall(
    callerId: string,
    receiverId: string,
    callType: 'audio' | 'video',
  ): Promise<void> {
    await this.assertCanChat(callerId, receiverId);
    const receiverPrivacy = await this.getPrivacySettings(receiverId);
    if (callType === 'audio' && !receiverPrivacy.allowVoiceCalls) {
      throw new ForbiddenException('This user has disabled voice calls');
    }
    if (callType === 'video' && !receiverPrivacy.allowVideoCalls) {
      throw new ForbiddenException('This user has disabled video calls');
    }
  }
}
