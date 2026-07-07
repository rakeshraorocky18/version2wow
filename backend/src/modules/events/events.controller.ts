import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, AddGuestDto, UpdateRsvpDto, AssignSeatDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RsvpStatus } from '../../common/enums';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ─── Events ───

  @Post()
  @ApiOperation({ summary: 'Create a wedding event' })
  async create(@Req() req: any, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my events' })
  async getMyEvents(@Req() req: any) {
    return this.eventsService.getUserEvents(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get event summary with guest stats' })
  async getSummary(@Param('id') id: string) {
    return this.eventsService.getEventSummary(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event' })
  async update(@Param('id') id: string, @Req() req: any, @Body() dto: Partial<CreateEventDto>) {
    return this.eventsService.updateEvent(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.eventsService.deleteEvent(id, req.user.id);
    return { message: 'Event deleted' };
  }

  // ─── Guests ───

  @Post(':id/guests')
  @ApiOperation({ summary: 'Add a guest' })
  async addGuest(@Param('id') id: string, @Req() req: any, @Body() dto: AddGuestDto) {
    return this.eventsService.addGuest(id, req.user.id, dto);
  }

  @Post(':id/guests/bulk')
  @ApiOperation({ summary: 'Add multiple guests' })
  async addGuestsBulk(@Param('id') id: string, @Req() req: any, @Body() guests: AddGuestDto[]) {
    return this.eventsService.addGuestsBulk(id, req.user.id, guests);
  }

  @Get(':id/guests')
  @ApiOperation({ summary: 'Get guest list' })
  async getGuests(
    @Param('id') id: string,
    @Query('rsvpStatus') rsvpStatus?: RsvpStatus,
    @Query('relation') relation?: string,
    @Query('category') category?: string,
  ) {
    return this.eventsService.getGuests(id, { rsvpStatus, relation, category });
  }

  @Put('guests/:guestId/rsvp')
  @ApiOperation({ summary: 'Update guest RSVP' })
  async updateRsvp(@Param('guestId') guestId: string, @Body() dto: UpdateRsvpDto) {
    return this.eventsService.updateRsvp(guestId, dto);
  }

  @Put('guests/:guestId/seat')
  @ApiOperation({ summary: 'Assign seat to guest' })
  async assignSeat(@Param('guestId') guestId: string, @Body() dto: AssignSeatDto) {
    return this.eventsService.assignSeat(guestId, dto);
  }

  @Post('guests/send-invitations')
  @ApiOperation({ summary: 'Mark invitations as sent' })
  async sendInvitations(@Body() body: { guestIds: string[] }) {
    await this.eventsService.markInvitationSent(body.guestIds);
    return { message: 'Invitations marked as sent' };
  }

  @Delete('guests/:guestId')
  @ApiOperation({ summary: 'Remove guest' })
  async removeGuest(@Param('guestId') guestId: string) {
    await this.eventsService.removeGuest(guestId);
    return { message: 'Guest removed' };
  }

  @Get(':id/seating')
  @ApiOperation({ summary: 'Get seating arrangement' })
  async getSeating(@Param('id') id: string) {
    return this.eventsService.getSeatingArrangement(id);
  }
}
