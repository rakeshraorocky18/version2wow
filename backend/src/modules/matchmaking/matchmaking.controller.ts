import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';
import { SendInterestDto } from './dto/matchmaking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('interest')
  @ApiOperation({ summary: 'Send interest to a user' })
  async sendInterest(@Req() req: any, @Body() dto: SendInterestDto) {
    return this.matchmakingService.sendInterest(req.user.id, dto);
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a match request' })
  async acceptInterest(@Req() req: any, @Param('id') id: string) {
    return this.matchmakingService.acceptInterest(req.user.id, id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a match request' })
  async rejectInterest(@Req() req: any, @Param('id') id: string) {
    return this.matchmakingService.rejectInterest(req.user.id, id);
  }

  @Get('received')
  @ApiOperation({ summary: 'Get received interest requests' })
  async getReceivedInterests(@Req() req: any) {
    return this.matchmakingService.getReceivedInterests(req.user.id);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent interest requests' })
  async getSentInterests(@Req() req: any) {
    return this.matchmakingService.getSentInterests(req.user.id);
  }

  @Get('accepted')
  @ApiOperation({ summary: 'Get accepted matches' })
  async getAcceptedMatches(@Req() req: any) {
    return this.matchmakingService.getAcceptedMatches(req.user.id);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested matches' })
  async getSuggestions(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.matchmakingService.getSuggestedMatches(req.user.id, page, limit);
  }
}
