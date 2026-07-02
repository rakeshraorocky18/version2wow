import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';
import { ProfileSearchQueryDto, SendInterestDto, ShortlistDto } from './dto/matchmaking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Get('premium/status')
  @ApiOperation({ summary: 'Get viewer premium subscription status for matchmaking' })
  async getPremiumStatus(@Req() req: { user: { id: string } }) {
    return this.matchmakingService.getPremiumStatus(req.user.id);
  }

  @Post('premium/dev-toggle')
  @ApiOperation({ summary: 'Dev only: toggle isPremium until payment is integrated' })
  async toggleDevPremium(@Req() req: { user: { id: string } }) {
    const current = await this.matchmakingService.getPremiumStatus(req.user.id);
    return this.matchmakingService.setDevPremiumStatus(req.user.id, !current.isPremium);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search profiles with filters and compatibility score' })
  async searchMatches(@Req() req: { user: { id: string; role?: string } }, @Query() query: ProfileSearchQueryDto) {
    return this.matchmakingService.searchMatches(req.user.id, query, req.user.role);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get AI-weighted suggested matches' })
  async getSuggestions(@Req() req: { user: { id: string; role?: string } }, @Query() query: ProfileSearchQueryDto) {
    return this.matchmakingService.getSuggestedMatches(req.user.id, query, req.user.role);
  }

  @Get('shortlist')
  @ApiOperation({ summary: 'Get shortlisted profiles' })
  async getShortlist(@Req() req: { user: { id: string; role?: string } }) {
    return this.matchmakingService.getShortlist(req.user.id, req.user.role);
  }

  @Post('shortlist')
  @ApiOperation({ summary: 'Add profile to shortlist' })
  async addShortlist(@Req() req: { user: { id: string } }, @Body() dto: ShortlistDto) {
    return this.matchmakingService.addToShortlist(req.user.id, dto.profileId);
  }

  @Delete('shortlist/:profileId')
  @ApiOperation({ summary: 'Remove profile from shortlist' })
  async removeShortlist(
    @Req() req: { user: { id: string } },
    @Param('profileId') profileId: string,
  ) {
    return this.matchmakingService.removeFromShortlist(req.user.id, profileId);
  }

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Get match profile with visibility based on accepted status' })
  async getMatchProfile(
    @Req() req: { user: { id: string } },
    @Param('profileId') profileId: string,
  ) {
    return this.matchmakingService.getMatchProfile(req.user.id, profileId);
  }

  @Get('compatibility/:profileId')
  @ApiOperation({ summary: 'Get compatibility score with a profile' })
  async getCompatibility(
    @Req() req: { user: { id: string } },
    @Param('profileId') profileId: string,
    @Query('includeHoroscope') includeHoroscope?: string,
  ) {
    return this.matchmakingService.getCompatibilityScore(
      req.user.id,
      profileId,
      includeHoroscope !== 'false',
    );
  }

  @Post('interest')
  @ApiOperation({ summary: 'Send interest / like to a profile' })
  async sendInterest(@Req() req: { user: { id: string } }, @Body() dto: SendInterestDto) {
    return this.matchmakingService.sendInterest(req.user.id, dto);
  }

  @Get('received')
  @ApiOperation({ summary: 'Get received interest requests' })
  async getReceivedInterests(@Req() req: { user: { id: string } }) {
    return this.matchmakingService.getReceivedInterests(req.user.id);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent interest requests' })
  async getSentInterests(@Req() req: { user: { id: string } }) {
    return this.matchmakingService.getSentInterests(req.user.id);
  }

  @Get('accepted')
  @ApiOperation({ summary: 'Get accepted matches (chat enabled)' })
  async getAcceptedMatches(@Req() req: { user: { id: string } }) {
    return this.matchmakingService.getAcceptedMatches(req.user.id);
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a match request' })
  async acceptInterest(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.matchmakingService.acceptInterest(req.user.id, id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a match request' })
  async rejectInterest(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.matchmakingService.rejectInterest(req.user.id, id);
  }
}
