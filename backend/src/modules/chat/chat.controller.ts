import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ChatServiceMongodb } from './chat.service.mongodb';
import {
  SendMessageDto,
  UpdateChatPrivacyDto,
  ScheduleMeetingDto,
  UpdateMeetingStatusDto,
  MarkConversationReadDto,
  UpdateThreadSettingsDto,
  ReportUserDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';
import {
  createImageFileFilter,
  createVideoFileFilter,
  createDocFileFilter,
  createUploadStorage,
  toPublicUrl,
} from '../../common/upload/upload.helpers';

type UploadedMulterFile = { filename: string; mimetype: string };

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chatService: ChatServiceMongodb,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send a message (post-match only)' })
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all active conversations' })
  async getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get chat contacts (accepted + blocked matches, minus deleted)' })
  async getChatContacts(@Req() req: any) {
    return this.chatService.getChatContacts(req.user.id);
  }

  @Get('hidden-contacts')
  @ApiOperation({ summary: 'Get user IDs of hidden/deleted chats' })
  async getHiddenContacts(@Req() req: any) {
    const hiddenUserIds = await this.chatService.getHiddenContactIds(req.user.id);
    return { hiddenUserIds };
  }

  @Delete('conversations/:userId')
  @ApiOperation({ summary: 'Clear chat history with a match (keeps contact in list)' })
  async deleteConversation(@Req() req: any, @Param('userId') userId: string) {
    return this.chatService.deleteConversation(req.user.id, userId);
  }

  @Post('conversations/:userId/hide')
  @ApiOperation({ summary: 'Delete chat from list (hide contact)' })
  async hideConversation(@Req() req: any, @Param('userId') userId: string) {
    return this.chatService.hideConversation(req.user.id, userId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get messages with a matched user' })
  async getMessages(
    @Req() req: any,
    @Query('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getMessages(req.user.id, userId, page, limit);
  }

  @Get('shared')
  @ApiOperation({ summary: 'Get shared media, links, or docs in a chat' })
  async getShared(
    @Req() req: any,
    @Query('userId') userId: string,
    @Query('kind') kind: 'media' | 'links' | 'docs' = 'media',
  ) {
    return this.chatService.getSharedMedia(req.user.id, userId, kind);
  }

  @Get('thread-settings/:userId')
  @ApiOperation({ summary: 'Get mute / disappearing settings for a chat' })
  async getThreadSettings(@Req() req: any, @Param('userId') userId: string) {
    return this.chatService.getThreadSettings(req.user.id, userId);
  }

  @Put('thread-settings/:userId')
  @ApiOperation({ summary: 'Update mute / disappearing settings for a chat' })
  async updateThreadSettings(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: UpdateThreadSettingsDto,
  ) {
    return this.chatService.updateThreadSettings(req.user.id, userId, dto);
  }

  @Post('report')
  @ApiOperation({ summary: 'Report a chat user' })
  async reportUser(@Req() req: any, @Body() dto: ReportUserDto) {
    return this.chatService.reportUser(req.user.id, dto);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message for me or for everyone' })
  async deleteMessage(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Query('mode') mode: 'me' | 'everyone' = 'everyone',
  ) {
    const result = await this.chatService.deleteMessage(req.user.id, messageId, mode);
    if (result.mode === 'everyone' && result.senderId && result.receiverId) {
      this.chatGateway.notifyMessageDeleted(result.messageId, result.senderId, result.receiverId);
    }
    return result;
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark messages from a partner as read' })
  async markRead(@Req() req: any, @Body() body: MarkConversationReadDto) {
    return this.chatService.markConversationRead(req.user.id, body.userId);
  }

  @Post('media')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media for chat (image, video, or document)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createUploadStorage('chat-media'),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const mimetype = file.mimetype;
        let filter = createImageFileFilter();
        if (mimetype.startsWith('video/')) {
          filter = createVideoFileFilter();
        } else if (mimetype === 'application/pdf') {
          filter = createDocFileFilter();
        }
        filter(req, file, cb);
      },
    }),
  )
  async uploadMedia(@UploadedFile() file: UploadedMulterFile) {
    if (!file) throw new BadRequestException('File is required');

    let type = 'file';
    if (file.mimetype.startsWith('image/')) type = 'image';
    else if (file.mimetype.startsWith('video/')) type = 'video';

    return {
      mediaUrl: toPublicUrl(`chat-media/${file.filename}`),
      type,
    };
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get chat privacy settings' })
  async getPrivacy(@Req() req: any) {
    return this.chatService.getPrivacySettings(req.user.id);
  }

  @Put('privacy')
  @ApiOperation({ summary: 'Update chat privacy settings' })
  async updatePrivacy(@Req() req: any, @Body() dto: UpdateChatPrivacyDto) {
    return this.chatService.updatePrivacySettings(req.user.id, dto);
  }

  @Post('meetings')
  @ApiOperation({ summary: 'Schedule a meeting with a match' })
  async scheduleMeeting(@Req() req: any, @Body() dto: ScheduleMeetingDto) {
    return this.chatService.scheduleMeeting(req.user.id, dto);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'Get scheduled meetings' })
  async getMeetings(@Req() req: any) {
    return this.chatService.getMeetings(req.user.id);
  }

  @Put('meetings/:id/status')
  @ApiOperation({ summary: 'Update meeting status (confirm/cancel)' })
  async updateMeetingStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    return this.chatService.updateMeetingStatus(req.user.id, id, dto.status);
  }

  @Get('can-chat/:userId')
  @ApiOperation({ summary: 'Check if chat is allowed with a user (post-match)' })
  async canChat(@Req() req: any, @Param('userId') userId: string) {
    const allowed = await this.chatService.hasAcceptedMatch(req.user.id, userId);
    return { allowed, restriction: 'post_match' };
  }
}
