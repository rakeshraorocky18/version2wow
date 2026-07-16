import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import {
  Message,
  MessageDocument,
  Conversation,
  ConversationDocument,
  ChatPrivacySettings,
  ChatPrivacySettingsDocument,
  ChatMeeting,
  ChatMeetingDocument,
  ChatHiddenContact,
  ChatHiddenContactDocument,
  ChatHistoryClear,
  ChatHistoryClearDocument,
  ChatThreadSettings,
  ChatThreadSettingsDocument,
} from './schemas/message.schema';
import {
  SendMessageDto,
  UpdateChatPrivacyDto,
  ScheduleMeetingDto,
  UpdateThreadSettingsDto,
  ReportUserDto,
} from './dto/chat.dto';
import { Match } from '../matchmaking/entities/match.entity';
import { MatchStatus, ChatRestrictionMode, ChatMeetingStatus } from '../../common/enums';
import { UsersService } from '../users/users.service.mongodb';
import { SQLITE_CONNECTION } from '../../config/database.constants';

type ConversationRecord = Conversation & Record<string, unknown>;
type MessageRecord = Message & Record<string, unknown>;
type PrivacyRecord = ChatPrivacySettings & Record<string, unknown>;
type MeetingRecord = ChatMeeting & Record<string, unknown>;
type ThreadSettingsRecord = ChatThreadSettings & Record<string, unknown>;

@Injectable()
export class ChatServiceMongodb {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(ChatPrivacySettings.name)
    private privacyModel: Model<ChatPrivacySettingsDocument>,
    @InjectModel(ChatMeeting.name)
    private meetingModel: Model<ChatMeetingDocument>,
    @InjectModel(ChatHiddenContact.name)
    private hiddenContactModel: Model<ChatHiddenContactDocument>,
    @InjectModel(ChatHistoryClear.name)
    private historyClearModel: Model<ChatHistoryClearDocument>,
    @InjectModel(ChatThreadSettings.name)
    private threadSettingsModel: Model<ChatThreadSettingsDocument>,
    @InjectRepository(Match, SQLITE_CONNECTION)
    private matchRepository: Repository<Match>,
    private usersService: UsersService,
  ) {}

  private toPlain<T>(doc: T | { toObject(): T }): T {
    if (doc && typeof (doc as { toObject?: () => T }).toObject === 'function') {
      return (doc as { toObject(): T }).toObject();
    }
    return doc as T;
  }

  private async resolveUserId(idOrUserId: string): Promise<string> {
    try {
      const profile = await this.usersService.getProfileByIdOrUserId(idOrUserId);
      return profile.userId as string;
    } catch {
      return idOrUserId;
    }
  }

  private async getHiddenUserIds(userId: string): Promise<Set<string>> {
    try {
      const resolvedUserId = await this.resolveUserId(userId);
      const rows = await this.hiddenContactModel
        .find({ $or: [{ userId: resolvedUserId }, { userId }] })
        .exec();
      const hidden = new Set<string>();
      for (const row of rows) {
        const plain = this.toPlain(row);
        hidden.add(plain.otherUserId as string);
        const resolvedOther = await this.resolveUserId(plain.otherUserId as string);
        hidden.add(resolvedOther);
        const profile = await this.usersService.getProfileOrNull(resolvedOther);
        if (profile?.id) hidden.add(profile.id as string);
      }
      return hidden;
    } catch {
      return new Set();
    }
  }

  async getHiddenContactIds(userId: string): Promise<string[]> {
    return Array.from(await this.getHiddenUserIds(userId));
  }

  /** Accepted + blocked matches that should appear in the chat list. */
  private async findChatMatchesForUser(userId: string): Promise<Match[]> {
    const resolvedUserId = await this.resolveUserId(userId);
    const profile = await this.usersService.getProfileOrNull(resolvedUserId);
    const selfIds = new Set([userId, resolvedUserId]);
    if (profile?.id) selfIds.add(profile.id as string);

    const rows = await this.matchRepository.find({
      where: [{ status: MatchStatus.ACCEPTED }, { status: MatchStatus.BLOCKED }],
      order: { updatedAt: 'DESC' },
    });

    return rows.filter((m) => selfIds.has(m.senderId) || selfIds.has(m.receiverId));
  }

  private async findAcceptedMatchesForUser(userId: string): Promise<Match[]> {
    const chatMatches = await this.findChatMatchesForUser(userId);
    return chatMatches.filter((m) => m.status === MatchStatus.ACCEPTED);
  }

  private partnerIdFromMatch(match: Match, selfIds: Set<string>): string {
    return selfIds.has(match.senderId) ? match.receiverId : match.senderId;
  }

  private async getSelfIds(userId: string): Promise<Set<string>> {
    const resolved = await this.resolveUserId(userId);
    const profile = await this.usersService.getProfileOrNull(resolved);
    const ids = new Set([userId, resolved]);
    if (profile?.id) ids.add(profile.id as string);
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
  ): Promise<ConversationRecord | null> {
    const selfIds = await this.getSelfIds(userId);
    const otherIds = await this.getSelfIds(otherUserId);
    const selfIdList = Array.from(selfIds);
    const conversations = await this.conversationModel
      .find({
        $or: [{ participant1: { $in: selfIdList } }, { participant2: { $in: selfIdList } }],
      })
      .exec();
    const found =
      conversations.find((c) => {
        const plain = this.toPlain(c);
        return (
          (selfIds.has(plain.participant1 as string) && otherIds.has(plain.participant2 as string)) ||
          (selfIds.has(plain.participant2 as string) && otherIds.has(plain.participant1 as string))
        );
      }) || null;
    return found ? this.toPlain<ConversationRecord>(found) : null;
  }

  private latestClearDate(...dates: Array<Date | null | undefined>): Date | null {
    const valid = dates.filter((d): d is Date => d instanceof Date);
    if (!valid.length) return null;
    return valid.reduce((latest, d) => (d > latest ? d : latest));
  }

  private async getHistoryClearedAt(userId: string, otherUserId: string): Promise<Date | null> {
    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    const row = await this.historyClearModel
      .findOne({ userId: resolvedUser, otherUserId: resolvedOther })
      .exec();
    return row?.clearedAt ?? null;
  }

  private async setHistoryClearedAt(userId: string, otherUserId: string): Promise<void> {
    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    const now = new Date();
    await this.historyClearModel
      .findOneAndUpdate(
        { userId: resolvedUser, otherUserId: resolvedOther },
        { $set: { clearedAt: now } },
        { upsert: true, new: true },
      )
      .exec();
  }

  private async getEffectiveClearedAt(
    userId: string,
    otherUserId: string,
    conv: ConversationRecord | null,
  ): Promise<Date | null> {
    const historyClearedAt = await this.getHistoryClearedAt(userId, otherUserId);
    const convClearedAt = conv ? await this.getClearedAtForUser(conv, userId) : null;
    return this.latestClearDate(historyClearedAt, convClearedAt);
  }

  private async isParticipantSlot1(conv: ConversationRecord, userId: string): Promise<boolean> {
    const selfIds = await this.getSelfIds(userId);
    return selfIds.has(conv.participant1 as string);
  }

  private async getClearedAtForUser(conv: ConversationRecord, userId: string): Promise<Date | null> {
    return (await this.isParticipantSlot1(conv, userId))
      ? (conv.clearedAtParticipant1 as Date | null)
      : (conv.clearedAtParticipant2 as Date | null);
  }

  private async setClearedAtForUser(conv: ConversationRecord, userId: string): Promise<void> {
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
    const existing = await this.hiddenContactModel
      .findOne({ userId: resolvedUserId, otherUserId: resolvedOther })
      .exec();
    if (!existing) {
      await this.hiddenContactModel.create({
        userId: resolvedUserId,
        otherUserId: resolvedOther,
      });
    }
  }

  private async unhideContact(userId: string, otherUserId: string): Promise<void> {
    const resolvedUserId = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    await this.hiddenContactModel
      .deleteOne({ userId: resolvedUserId, otherUserId: resolvedOther })
      .exec();
  }

  async hasAcceptedMatch(userA: string, userB: string): Promise<boolean> {
    const match = await this.findPairMatch(userA, userB);
    return match?.status === MatchStatus.ACCEPTED;
  }

  /** Can open/view the thread (accepted or blocked). */
  async hasChatAccess(userA: string, userB: string): Promise<boolean> {
    const match = await this.findPairMatch(userA, userB);
    return match?.status === MatchStatus.ACCEPTED || match?.status === MatchStatus.BLOCKED;
  }

  async isBlockedWith(userA: string, userB: string): Promise<boolean> {
    const match = await this.findPairMatch(userA, userB);
    return match?.status === MatchStatus.BLOCKED;
  }

  private async findPairMatch(userA: string, userB: string): Promise<Match | null> {
    const resolvedB = await this.resolveUserId(userB);
    const profileB = await this.usersService.getProfileOrNull(resolvedB);
    const bIds = new Set([userB, resolvedB]);
    if (profileB?.id) bIds.add(profileB.id as string);

    const matches = await this.findChatMatchesForUser(userA);
    const resolvedA = await this.resolveUserId(userA);
    const profileA = await this.usersService.getProfileOrNull(resolvedA);
    const aIds = new Set([userA, resolvedA]);
    if (profileA?.id) aIds.add(profileA.id as string);

    for (const match of matches) {
      const rawPartner = this.partnerIdFromMatch(match, aIds);
      const partnerId = await this.resolveUserId(rawPartner);
      if (bIds.has(rawPartner) || bIds.has(partnerId)) return match;
    }
    return null;
  }

  private async assertCanChat(senderId: string, receiverId: string): Promise<void> {
    if (await this.isBlockedWith(senderId, receiverId)) {
      throw new ForbiddenException('Messaging is disabled because this user is blocked');
    }

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

  private async getOrCreateThreadSettings(
    userId: string,
    otherUserId: string,
  ): Promise<ThreadSettingsRecord> {
    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    let row = await this.threadSettingsModel
      .findOne({ userId: resolvedUser, otherUserId: resolvedOther })
      .exec();
    if (!row) {
      row = await this.threadSettingsModel.create({
        userId: resolvedUser,
        otherUserId: resolvedOther,
        muted: false,
        disappearingSeconds: 0,
      });
    }
    return this.toPlain<ThreadSettingsRecord>(row);
  }

  async getThreadSettings(userId: string, otherUserId: string): Promise<ThreadSettingsRecord> {
    const canView = await this.hasChatAccess(userId, otherUserId);
    if (!canView) {
      throw new ForbiddenException('You can only manage settings for matched chats');
    }
    return this.getOrCreateThreadSettings(userId, otherUserId);
  }

  async updateThreadSettings(
    userId: string,
    otherUserId: string,
    dto: UpdateThreadSettingsDto,
  ): Promise<ThreadSettingsRecord> {
    const settings = await this.getThreadSettings(userId, otherUserId);
    if (dto.muted !== undefined) settings.muted = dto.muted;
    if (dto.disappearingSeconds !== undefined) {
      settings.disappearingSeconds = dto.disappearingSeconds;
    }
    await this.threadSettingsModel
      .updateOne(
        { userId: settings.userId, otherUserId: settings.otherUserId },
        {
          $set: {
            muted: settings.muted,
            disappearingSeconds: settings.disappearingSeconds,
          },
        },
      )
      .exec();
    return settings;
  }

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<MessageRecord> {
    await this.assertCanChat(senderId, dto.receiverId);

    if (dto.type && dto.type !== 'text') {
      await this.assertMediaAllowed(senderId, dto.receiverId);
    }

    await this.unhideContact(senderId, dto.receiverId);

    const resolvedSender = await this.resolveUserId(senderId);
    const resolvedReceiver = await this.resolveUserId(dto.receiverId);

    let conversation = await this.findConversation(senderId, dto.receiverId);

    const preview =
      dto.type === 'image'
        ? '📷 Photo'
        : dto.type === 'video'
          ? '🎬 Video'
          : dto.type === 'file'
            ? '📎 File'
            : dto.content;

    if (!conversation) {
      const created = await this.conversationModel.create({
        participant1: resolvedSender,
        participant2: resolvedReceiver,
        lastMessage: preview,
        lastMessageAt: new Date(),
        isActive: true,
      });
      conversation = this.toPlain<ConversationRecord>(created);
    } else {
      if (!conversation.isActive) {
        conversation.isActive = true;
      }
      conversation.lastMessage = preview;
      conversation.lastMessageAt = new Date();
      await this.conversationModel
        .updateOne({ id: conversation.id }, { $set: conversation })
        .exec();
    }

    const senderThread = await this.getOrCreateThreadSettings(senderId, dto.receiverId);
    const receiverThread = await this.getOrCreateThreadSettings(dto.receiverId, senderId);
    const disappearSeconds = Math.max(
      Number(senderThread.disappearingSeconds || 0),
      Number(receiverThread.disappearingSeconds || 0),
    );

    const messagePayload: Record<string, unknown> = {
      senderId: resolvedSender,
      receiverId: resolvedReceiver,
      content: dto.content,
      type: dto.type || 'text',
      mediaUrl: dto.mediaUrl,
      isRead: false,
      deletedFor: [],
    };
    if (disappearSeconds > 0) {
      messagePayload.expiresAt = new Date(Date.now() + disappearSeconds * 1000);
    }

    const message = await this.messageModel.create(messagePayload);

    return this.toPlain<MessageRecord>(message);
  }

  async getConversations(userId: string) {
    return this.getChatContacts(userId);
  }

  async getChatContacts(userId: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const profile = await this.usersService.getProfileOrNull(resolvedUserId);
    const selfIds = new Set([userId, resolvedUserId]);
    if (profile?.id) selfIds.add(profile.id as string);

    const matches = await this.findChatMatchesForUser(userId);
    const hidden = await this.getHiddenUserIds(userId);

    const selfIdList = Array.from(selfIds);
    const conversations = await this.conversationModel
      .find({
        $or: [{ participant1: { $in: selfIdList } }, { participant2: { $in: selfIdList } }],
      })
      .exec();

    const convByOther = new Map<string, ConversationRecord>();
    for (const conv of conversations) {
      const plain = this.toPlain<ConversationRecord>(conv);
      const rawOther = selfIds.has(plain.participant1 as string)
        ? (plain.participant2 as string)
        : (plain.participant1 as string);
      const otherId = await this.resolveUserId(rawOther);
      convByOther.set(otherId, plain);
      convByOther.set(rawOther, plain);
    }

    const contacts: Array<{
      userId: string;
      name: string;
      subtitle: string;
      photo?: string;
      lastMessageAt?: Date;
      isBlocked?: boolean;
      muted?: boolean;
    }> = [];

    const seenPartners = new Set<string>();

    for (const match of matches) {
      const rawPartner = this.partnerIdFromMatch(match, selfIds);
      const partnerUserId = await this.resolveUserId(rawPartner);
      if (seenPartners.has(partnerUserId)) continue;
      seenPartners.add(partnerUserId);

      if (hidden.has(partnerUserId) || hidden.has(rawPartner)) continue;

      const partnerProfile = await this.usersService.getProfileOrNull(partnerUserId);
      const wizard = (partnerProfile?.wizardProfile || {}) as Record<string, unknown>;
      const pd = (wizard.personalDetails || {}) as Record<string, string>;
      const firstName = pd.firstName || partnerProfile?.firstName || '';
      const lastName = pd.lastName || partnerProfile?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || 'Mutual match';
      const photo =
        (wizard.profilePhoto as string) ||
        (partnerProfile?.photos as string[])?.[0] ||
        '';

      const conv = convByOther.get(partnerUserId) || convByOther.get(rawPartner);
      const clearedAt = await this.getEffectiveClearedAt(userId, partnerUserId, conv ?? null);
      const thread = await this.getOrCreateThreadSettings(userId, partnerUserId);
      const isBlocked = match.status === MatchStatus.BLOCKED;
      contacts.push({
        userId: partnerUserId,
        name,
        subtitle: isBlocked
          ? 'Blocked'
          : clearedAt
            ? 'Mutual match — say hello!'
            : conv?.lastMessage || 'Mutual match — say hello!',
        photo: photo || undefined,
        lastMessageAt: clearedAt ? match.updatedAt : conv?.lastMessageAt || match.updatedAt,
        isBlocked,
        muted: !!thread.muted,
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
    const canView = await this.hasChatAccess(userId, otherUserId);
    if (!canView) {
      throw new ForbiddenException('You can only view messages with matched chats');
    }

    const conv = await this.findConversation(userId, otherUserId);
    const clearedAfter = await this.getEffectiveClearedAt(userId, otherUserId, conv);
    const resolvedUser = await this.resolveUserId(userId);
    const now = Date.now();

    const selfIds = await this.getSelfIds(userId);
    const otherIds = await this.getSelfIds(otherUserId);

    const skip = (page - 1) * limit;
    const rawMessages = await this.messageModel.find().sort({ createdAt: -1 }).exec();

    const messages = rawMessages
      .map((m) => this.toPlain(m))
      .filter((m) => {
        const senderOk = selfIds.has(m.senderId as string);
        const receiverOk = otherIds.has(m.receiverId as string);
        const senderOkRev = otherIds.has(m.senderId as string);
        const receiverOkRev = selfIds.has(m.receiverId as string);
        const isPair = (senderOk && receiverOk) || (senderOkRev && receiverOkRev);
        if (!isPair) return false;
        if (clearedAfter && new Date(m.createdAt as Date).getTime() <= clearedAfter.getTime()) {
          return false;
        }
        const deletedFor = (m.deletedFor as string[]) || [];
        if (deletedFor.includes(userId) || deletedFor.includes(resolvedUser)) {
          return false;
        }
        if (m.expiresAt && new Date(m.expiresAt as Date).getTime() <= now) {
          return false;
        }
        return true;
      });

    const pageMessages = messages.slice(skip, skip + limit);
    await this.markConversationRead(userId, otherUserId);
    const isBlocked = await this.isBlockedWith(userId, otherUserId);
    const thread = await this.getOrCreateThreadSettings(userId, otherUserId);
    return {
      messages: pageMessages,
      total: messages.length,
      cleared: !!clearedAfter,
      isBlocked,
      muted: !!thread.muted,
      disappearingSeconds: Number(thread.disappearingSeconds || 0),
    };
  }

  async getSharedMedia(userId: string, otherUserId: string, kind: 'media' | 'links' | 'docs' = 'media') {
    const result = await this.getMessages(userId, otherUserId, 1, 500);
    const messages = (result.messages || []) as unknown as MessageRecord[];
    const items = messages.filter((m) => {
      if (kind === 'media') return m.type === 'image' || m.type === 'video';
      if (kind === 'docs') return m.type === 'file';
      if (kind === 'links') {
        return m.type === 'text' && typeof m.content === 'string' && /https?:\/\/[^\s]+/i.test(m.content);
      }
      return false;
    });
    return { items, kind };
  }

  async reportUser(reporterId: string, dto: ReportUserDto) {
    const canReport = await this.hasChatAccess(reporterId, dto.userId);
    if (!canReport) {
      throw new ForbiddenException('You can only report users from your chats');
    }
    // Soft report log — stored as a system-style message marker for ops review
    await this.messageModel.create({
      senderId: await this.resolveUserId(reporterId),
      receiverId: await this.resolveUserId(dto.userId),
      content: `[REPORT] ${dto.reason || 'No reason provided'}`,
      type: 'report',
      isRead: true,
      deletedFor: [await this.resolveUserId(reporterId), await this.resolveUserId(dto.userId)],
    });
    return { success: true };
  }

  async markConversationRead(userId: string, otherUserId: string): Promise<{ success: boolean; marked: number }> {
    const selfIds = Array.from(await this.getSelfIds(userId));
    const otherIds = Array.from(await this.getSelfIds(otherUserId));

    // Use native collection update to avoid Mongoose casting quirks on boolean filters
    const result = await this.messageModel.collection.updateMany(
      {
        senderId: { $in: otherIds },
        receiverId: { $in: selfIds },
        isRead: { $ne: true },
      },
      { $set: { isRead: true, readAt: new Date() } },
    );

    return { success: true, marked: result.modifiedCount ?? 0 };
  }

  private messagePreview(message: MessageRecord | null): string | null {
    if (!message) return null;
    if (message.type === 'image') return '📷 Photo';
    if (message.type === 'video') return '🎬 Video';
    if (message.type === 'file') return '📎 File';
    return message.content as string;
  }

  async deleteMessage(
    userId: string,
    messageId: string,
    mode: 'me' | 'everyone' = 'everyone',
  ): Promise<{ success: boolean }> {
    const message = await this.messageModel.findOne({ id: messageId }).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const plain = this.toPlain(message);
    const resolvedUser = await this.resolveUserId(userId);
    const senderResolved = await this.resolveUserId(plain.senderId as string);
    const receiverResolved = await this.resolveUserId(plain.receiverId as string);

    const isParticipant =
      plain.senderId === userId ||
      plain.senderId === resolvedUser ||
      plain.receiverId === userId ||
      plain.receiverId === resolvedUser;
    if (!isParticipant) {
      throw new ForbiddenException('You can only delete messages from your chats');
    }

    const canDeleteInChat =
      (await this.hasChatAccess(userId, senderResolved)) ||
      (await this.hasChatAccess(userId, receiverResolved));
    if (!canDeleteInChat) {
      throw new ForbiddenException('You can only delete messages from matched chats');
    }

    if (mode === 'me') {
      const deletedFor = Array.from(
        new Set([...(plain.deletedFor as string[] | undefined) || [], resolvedUser]),
      );
      await this.messageModel.updateOne({ id: plain.id }, { $set: { deletedFor } }).exec();
      return { success: true };
    }

    if (plain.senderId !== userId && plain.senderId !== resolvedUser) {
      throw new ForbiddenException('You can only delete your own messages for everyone');
    }

    await this.messageModel.deleteOne({ id: plain.id }).exec();

    const conversation = await this.findConversation(senderResolved, receiverResolved);
    if (conversation) {
      const latest = await this.messageModel
        .findOne({
          $or: [
            { senderId: senderResolved, receiverId: receiverResolved },
            { senderId: receiverResolved, receiverId: senderResolved },
          ],
        })
        .sort({ createdAt: -1 })
        .exec();
      const latestPlain = latest ? this.toPlain<MessageRecord>(latest) : null;
      await this.conversationModel
        .updateOne(
          { id: conversation.id },
          {
            $set: {
              lastMessage: this.messagePreview(latestPlain) ?? '',
              lastMessageAt: latestPlain?.createdAt ?? new Date(0),
            },
          },
        )
        .exec();
    }

    return { success: true };
  }

  /** Clear history for the current user; contact stays in the list. */
  async deleteConversation(userId: string, otherUserId: string): Promise<{ success: boolean }> {
    const canDelete = await this.hasChatAccess(userId, otherUserId);
    if (!canDelete) {
      throw new ForbiddenException('You can only clear chats with matched contacts');
    }

    await this.unhideContact(userId, otherUserId);
    await this.setHistoryClearedAt(userId, otherUserId);

    const resolvedUser = await this.resolveUserId(userId);
    const resolvedOther = await this.resolveUserId(otherUserId);
    const selfIds = await this.getSelfIds(userId);
    const otherIds = await this.getSelfIds(otherUserId);

    await this.messageModel.collection.updateMany(
      {
        senderId: { $in: Array.from(otherIds) },
        receiverId: { $in: Array.from(selfIds) },
        isRead: { $ne: true },
      },
      { $set: { isRead: true, readAt: new Date() } },
    );

    let conversation = await this.findConversation(userId, otherUserId);

    if (!conversation) {
      const created = await this.conversationModel.create({
        participant1: resolvedUser,
        participant2: resolvedOther,
        isActive: false,
        clearedAtParticipant1: new Date(),
      });
      conversation = this.toPlain<ConversationRecord>(created);
    } else {
      await this.setClearedAtForUser(conversation, userId);
      conversation.isActive = false;
      await this.conversationModel
        .updateOne({ id: conversation.id }, { $set: conversation })
        .exec();
    }

    return { success: true };
  }

  /** Remove chat from the list (hide). History is also cleared for this user. */
  async hideConversation(userId: string, otherUserId: string): Promise<{ success: boolean }> {
    await this.deleteConversation(userId, otherUserId);
    await this.hideContact(userId, otherUserId);
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const selfIds = Array.from(await this.getSelfIds(userId));
    const unreadDocs = await this.messageModel.collection
      .find({
        receiverId: { $in: selfIds },
        isRead: { $ne: true },
      })
      .toArray();

    if (!unreadDocs.length) return 0;

    let count = 0;
    const clearedCache = new Map<string, Date | null>();
    const resolvedUser = await this.resolveUserId(userId);
    const now = Date.now();

    for (const msg of unreadDocs) {
      const senderId = String(msg.senderId || '');
      if (!senderId) continue;

      const canChat = await this.hasChatAccess(userId, senderId);
      if (!canChat) continue;
      if (await this.isBlockedWith(userId, senderId)) continue;

      const deletedFor = (msg.deletedFor as string[]) || [];
      if (deletedFor.includes(userId) || deletedFor.includes(resolvedUser)) continue;
      if (msg.expiresAt && new Date(msg.expiresAt as Date).getTime() <= now) continue;

      let clearedAfter = clearedCache.get(senderId);
      if (clearedAfter === undefined) {
        const conv = await this.findConversation(userId, senderId);
        clearedAfter = await this.getEffectiveClearedAt(userId, senderId, conv);
        clearedCache.set(senderId, clearedAfter);
      }
      if (clearedAfter && msg.createdAt && new Date(msg.createdAt as Date).getTime() <= clearedAfter.getTime()) {
        continue;
      }
      count += 1;
    }

    return count;
  }

  async getPrivacySettings(userId: string): Promise<PrivacyRecord> {
    let settings = await this.privacyModel.findOne({ userId }).exec();
    if (!settings) {
      settings = await this.privacyModel.create({
        userId,
        chatRestriction: ChatRestrictionMode.POST_MATCH,
      });
    }
    return this.toPlain<PrivacyRecord>(settings);
  }

  async updatePrivacySettings(userId: string, dto: UpdateChatPrivacyDto): Promise<PrivacyRecord> {
    const settings = await this.getPrivacySettings(userId);
    if (dto.chatRestriction === ChatRestrictionMode.PRE_MATCH) {
      throw new BadRequestException('Pre-match chat is not enabled yet. Only post-match chat is available.');
    }
    Object.assign(settings, dto);
    await this.privacyModel.updateOne({ userId }, { $set: settings }).exec();
    return settings;
  }

  async scheduleMeeting(organizerId: string, dto: ScheduleMeetingDto): Promise<MeetingRecord> {
    await this.assertCanChat(organizerId, dto.participantId);

    const meeting = await this.meetingModel.create({
      organizerId,
      participantId: dto.participantId,
      title: dto.title,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes || 30,
      notes: dto.notes,
      status: ChatMeetingStatus.PENDING,
    });

    return this.toPlain<MeetingRecord>(meeting);
  }

  async getMeetings(userId: string): Promise<MeetingRecord[]> {
    const meetings = await this.meetingModel
      .find({ $or: [{ organizerId: userId }, { participantId: userId }] })
      .sort({ scheduledAt: 1 })
      .exec();
    return meetings.map((m) => this.toPlain<MeetingRecord>(m));
  }

  async updateMeetingStatus(
    userId: string,
    meetingId: string,
    status: ChatMeetingStatus,
  ): Promise<MeetingRecord> {
    const meeting = await this.meetingModel.findOne({ id: meetingId }).exec();
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    const plain = this.toPlain<MeetingRecord>(meeting);
    if (plain.organizerId !== userId && plain.participantId !== userId) {
      throw new ForbiddenException('You are not part of this meeting');
    }
    plain.status = status;
    await this.meetingModel.updateOne({ id: meetingId }, { $set: { status } }).exec();
    return plain;
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
