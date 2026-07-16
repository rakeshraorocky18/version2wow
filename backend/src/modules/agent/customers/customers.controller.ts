import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AgentCustomersService } from './customers.service';
import {
  CreateAgentCustomerDto,
  ListCustomersQueryDto,
  UpdateAgentCustomerDto,
} from './dto/customer.dto';
import { MatchingSearchDto } from './dto/matching.dto';
import {
  CustomerChatQueryDto,
  CustomerNoteDto,
  CustomerNotificationQueryDto,
  CustomerProfileActionDto,
  MarkNotificationDto,
} from './dto/customer-workspace.dto';
import { SendMessageDto } from '../../chat/dto/chat.dto';

@ApiTags('Agent Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent/customers')
export class AgentCustomersController {
  constructor(private readonly customersService: AgentCustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers assigned to the agent' })
  list(
    @Req() req: { user: { id: string } },
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersService.list(req.user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Onboard a new customer' })
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateAgentCustomerDto,
  ) {
    return this.customersService.create(req.user.id, dto);
  }

  @Post(':customerId/matching/search')
  @ApiOperation({ summary: 'Search matching profiles for a customer' })
  searchMatches(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: MatchingSearchDto,
  ) {
    return this.customersService.searchMatches(req.user.id, customerId, dto);
  }

  @Get(':customerId/matching/recommendations')
  @ApiOperation({ summary: 'AI suggested profiles for a customer' })
  getRecommendations(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.getRecommendations(req.user.id, customerId);
  }

  @Get(':customerId/matching/profiles/:matchedProfileId')
  @ApiOperation({
    summary: 'Full matched profile detail (platform-wide, for matchmaking)',
  })
  getMatchProfile(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Param('matchedProfileId') matchedProfileId: string,
  ) {
    return this.customersService.getMatchProfile(
      req.user.id,
      customerId,
      matchedProfileId,
    );
  }

  @Get(':customerId/workspace')
  @ApiOperation({ summary: 'Customer details workspace header and counters' })
  getWorkspace(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.getWorkspace(req.user.id, customerId);
  }

  @Get(':customerId/matches')
  @ApiOperation({ summary: 'Recommended match profiles for selected customer' })
  getCustomerMatches(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Query() query: MatchingSearchDto,
  ) {
    return this.customersService.getCustomerMatches(req.user.id, customerId, query);
  }

  @Get(':customerId/chat')
  @ApiOperation({ summary: 'Accepted match contacts and active conversation for selected customer' })
  getCustomerChat(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Query() query: CustomerChatQueryDto,
  ) {
    return this.customersService.getChat(req.user.id, customerId, query);
  }

  @Post(':customerId/chat/messages')
  @ApiOperation({ summary: 'Send a message as selected customer to an accepted match' })
  sendCustomerChatMessage(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.customersService.sendChatMessage(req.user.id, customerId, dto);
  }

  @Get(':customerId/history')
  @ApiOperation({ summary: 'Customer match history grouped by relationship type' })
  getCustomerHistory(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.getHistory(req.user.id, customerId);
  }

  @Get(':customerId/notifications')
  @ApiOperation({ summary: 'Notifications for selected customer only' })
  getCustomerNotifications(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Query() query: CustomerNotificationQueryDto,
  ) {
    return this.customersService.getNotifications(req.user.id, customerId, query);
  }

  @Post(':customerId/notifications/read')
  @ApiOperation({ summary: 'Mark selected customer notifications as read' })
  markCustomerNotificationsRead(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: MarkNotificationDto,
  ) {
    return this.customersService.markNotificationsRead(
      req.user.id,
      customerId,
      dto.notificationId,
    );
  }

  @Post(':customerId/send-interest')
  @ApiOperation({ summary: 'Send interest from selected customer to a profile' })
  sendInterest(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.sendInterest(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/accept-interest')
  @ApiOperation({ summary: 'Accept an interest request for selected customer' })
  acceptInterest(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.acceptInterest(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/decline-interest')
  @ApiOperation({ summary: 'Decline an interest request for selected customer' })
  declineInterest(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.declineInterest(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/withdraw-interest')
  @ApiOperation({ summary: 'Withdraw a sent interest request for selected customer' })
  withdrawInterest(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.withdrawInterest(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/favourite')
  @ApiOperation({ summary: 'Toggle favourite for selected customer and profile' })
  favourite(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.toggleFavourite(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/shortlist')
  @ApiOperation({ summary: 'Toggle shortlist for selected customer and profile' })
  shortlist(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.toggleShortlist(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/block')
  @ApiOperation({ summary: 'Block profile for selected customer' })
  block(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.blockProfile(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/unblock')
  @ApiOperation({ summary: 'Unblock profile for selected customer' })
  unblock(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.unblockProfile(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/ignore')
  @ApiOperation({ summary: 'Ignore profile for selected customer' })
  ignore(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerProfileActionDto,
  ) {
    return this.customersService.ignoreProfile(req.user.id, customerId, dto.profileId);
  }

  @Post(':customerId/notes')
  @ApiOperation({ summary: 'Add agent-only internal notes for a profile' })
  addProfileNote(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: CustomerNoteDto,
  ) {
    return this.customersService.addProfileNote(
      req.user.id,
      customerId,
      dto.profileId,
      dto.content,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  getOne(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.customersService.getOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAgentCustomerDto,
  ) {
    return this.customersService.update(req.user.id, id, dto);
  }
}
