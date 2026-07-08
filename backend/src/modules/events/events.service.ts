import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { EventEntity, GuestEntity, InvitationEntity, RsvpResponseEntity } from './entities/event.entity';
import {
  CreateEventDto, AddGuestDto, UpdateRsvpDto, AssignSeatDto,
  CreateInvitationsDto, SendInvitationsDto, PublicRsvpDto,
} from './dto/event.dto';
import { RsvpStatus, InvitationStatus } from '../../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(GuestEntity)
    private guestRepository: Repository<GuestEntity>,
    @InjectRepository(InvitationEntity)
    private invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(RsvpResponseEntity)
    private rsvpRepository: Repository<RsvpResponseEntity>,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Events ───

  async createEvent(userId: string, dto: CreateEventDto): Promise<EventEntity> {
    const event = this.eventRepository.create({ userId, ...dto });
    return this.eventRepository.save(event);
  }

  async getEvent(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async getUserEvents(userId: string): Promise<EventEntity[]> {
    return this.eventRepository.find({ where: { userId }, order: { dateTime: 'ASC' } });
  }

  async updateEvent(id: string, userId: string, dto: Partial<CreateEventDto>): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');
    Object.assign(event, dto);
    return this.eventRepository.save(event);
  }

  async deleteEvent(id: string, userId: string): Promise<void> {
    await this.rsvpRepository.delete({ eventId: id });
    await this.invitationRepository.delete({ eventId: id });
    await this.guestRepository.delete({ eventId: id });
    await this.eventRepository.delete({ id, userId });
  }

  async getEventSummary(eventId: string) {
    const event = await this.getEvent(eventId);
    const guests = await this.guestRepository.find({ where: { eventId } });

    const totalInvited = guests.reduce((sum, g) => sum + g.partySize, 0);
    const accepted = guests.filter(g => g.rsvpStatus === RsvpStatus.ACCEPTED);
    const declined = guests.filter(g => g.rsvpStatus === RsvpStatus.DECLINED);
    const pending = guests.filter(g => g.rsvpStatus === RsvpStatus.INVITED);
    const maybe = guests.filter(g => g.rsvpStatus === RsvpStatus.MAYBE);

    return {
      event,
      guestStats: {
        totalGuests: guests.length,
        totalHeadcount: totalInvited,
        accepted: accepted.length,
        acceptedHeadcount: accepted.reduce((s, g) => s + g.partySize, 0),
        declined: declined.length,
        pending: pending.length,
        maybe: maybe.length,
        invitationsSent: guests.filter(g => g.invitationSent).length,
      },
      dietarySummary: this.getDietarySummary(guests),
      sideSummary: {
        brideSide: guests.filter(g => g.relation === 'bride_side').length,
        groomSide: guests.filter(g => g.relation === 'groom_side').length,
      },
    };
  }

  private getDietarySummary(guests: GuestEntity[]) {
    const summary: Record<string, number> = {};
    guests.forEach(g => {
      const pref = g.dietaryPreference || 'not_specified';
      summary[pref] = (summary[pref] || 0) + g.partySize;
    });
    return summary;
  }

  // ─── Guests ───

  async addGuest(eventId: string, userId: string, dto: AddGuestDto): Promise<GuestEntity> {
    const event = await this.getEvent(eventId);
    const guest = this.guestRepository.create({
      eventId,
      userId,
      ...dto,
      rsvpStatus: RsvpStatus.INVITED,
    });
    const saved = await this.guestRepository.save(guest);

    // Update event guest counts
    event.expectedGuests = await this.guestRepository.count({ where: { eventId } });
    await this.eventRepository.save(event);

    return saved;
  }

  async addGuestsBulk(eventId: string, userId: string, guests: AddGuestDto[]): Promise<GuestEntity[]> {
    const results: GuestEntity[] = [];
    for (const dto of guests) {
      results.push(await this.addGuest(eventId, userId, dto));
    }
    return results;
  }

  async getGuests(eventId: string, filters?: { rsvpStatus?: RsvpStatus; relation?: string; category?: string }) {
    const where: any = { eventId };
    if (filters?.rsvpStatus) where.rsvpStatus = filters.rsvpStatus;
    if (filters?.relation) where.relation = filters.relation;
    if (filters?.category) where.category = filters.category;

    return this.guestRepository.find({ where, order: { name: 'ASC' } });
  }

  async updateRsvp(guestId: string, dto: UpdateRsvpDto): Promise<GuestEntity> {
    const guest = await this.guestRepository.findOne({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Guest not found');

    guest.rsvpStatus = dto.rsvpStatus;
    guest.rsvpMessage = dto.rsvpMessage || '';
    const saved = await this.guestRepository.save(guest);

    await this.rsvpRepository.save(this.rsvpRepository.create({
      eventId: guest.eventId,
      guestId: guest.id,
      rsvpStatus: dto.rsvpStatus,
      rsvpMessage: dto.rsvpMessage,
      attendingCount: guest.partySize,
      respondedVia: 'host',
    }));

    await this.recomputeConfirmedGuests(guest.eventId);
    return saved;
  }

  private async recomputeConfirmedGuests(eventId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    const confirmedGuests = await this.guestRepository.find({
      where: { eventId, rsvpStatus: RsvpStatus.ACCEPTED },
    });
    event.confirmedGuests = confirmedGuests.reduce((s, g) => s + g.partySize, 0);
    await this.eventRepository.save(event);
  }

  async assignSeat(guestId: string, dto: AssignSeatDto): Promise<GuestEntity> {
    const guest = await this.guestRepository.findOne({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Guest not found');
    if (dto.tableNumber !== undefined) guest.tableNumber = dto.tableNumber;
    if (dto.seatNumber !== undefined) guest.seatNumber = dto.seatNumber;
    return this.guestRepository.save(guest);
  }

  async markInvitationSent(guestIds: string[]): Promise<void> {
    await this.guestRepository
      .createQueryBuilder()
      .update()
      .set({ invitationSent: true, invitationSentAt: new Date().toISOString() })
      .whereInIds(guestIds)
      .execute();
  }

  async removeGuest(guestId: string): Promise<void> {
    const guest = await this.guestRepository.findOne({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Guest not found');
    await this.guestRepository.delete(guestId);

    // Update event counts
    const event = await this.getEvent(guest.eventId);
    event.expectedGuests = await this.guestRepository.count({ where: { eventId: guest.eventId } });
    await this.eventRepository.save(event);
  }

  async getSeatingArrangement(eventId: string) {
    const guests = await this.guestRepository.find({
      where: { eventId, rsvpStatus: RsvpStatus.ACCEPTED },
      order: { tableNumber: 'ASC', seatNumber: 'ASC' },
    });

    const tables: Record<string, GuestEntity[]> = {};
    const unassigned: GuestEntity[] = [];

    guests.forEach(g => {
      if (g.tableNumber) {
        if (!tables[g.tableNumber]) tables[g.tableNumber] = [];
        tables[g.tableNumber].push(g);
      } else {
        unassigned.push(g);
      }
    });

    return { tables, unassigned, totalSeated: guests.length - unassigned.length };
  }

  // ─── Invitations ───

  async createInvitations(eventId: string, userId: string, dto: CreateInvitationsDto): Promise<InvitationEntity[]> {
    await this.getEvent(eventId);

    let guests: GuestEntity[];
    if (dto.guestIds?.length) {
      guests = await this.guestRepository.find({ where: { eventId, id: In(dto.guestIds) } });
      if (guests.length !== dto.guestIds.length) {
        throw new BadRequestException('One or more guests do not belong to this event');
      }
    } else {
      guests = await this.guestRepository.find({ where: { eventId } });
    }

    const existing = await this.invitationRepository.find({
      where: { eventId, guestId: In(guests.map(g => g.id)) },
    });
    const alreadyInvited = new Set(existing.map(i => i.guestId));
    const toInvite = guests.filter(g => !alreadyInvited.has(g.id));

    const invitations = toInvite.map(guest =>
      this.invitationRepository.create({
        eventId,
        guestId: guest.id,
        userId,
        channel: dto.channel,
        message: dto.message,
        rsvpToken: randomBytes(16).toString('hex'),
      }),
    );
    return this.invitationRepository.save(invitations);
  }

  async getInvitations(eventId: string, status?: InvitationStatus) {
    const where: any = { eventId };
    if (status) where.status = status;
    const invitations = await this.invitationRepository.find({ where, order: { createdAt: 'ASC' } });

    const guests = await this.guestRepository.find({ where: { eventId } });
    const guestById = new Map(guests.map(g => [g.id, g]));
    return invitations.map(inv => ({ ...inv, guest: guestById.get(inv.guestId) || null }));
  }

  async sendInvitations(userId: string, dto: SendInvitationsDto) {
    const invitations = await this.invitationRepository.find({ where: { id: In(dto.invitationIds) } });
    if (!invitations.length) throw new NotFoundException('No invitations found');

    const sentAt = new Date().toISOString();
    for (const invitation of invitations) {
      const guest = await this.guestRepository.findOne({ where: { id: invitation.guestId } });
      if (!guest) continue;

      // Delivery stub — real WhatsApp/SMS/Email providers plug in here
      await this.notificationsService.sendNotification({
        userId,
        title: `Invitation via ${invitation.channel}`,
        body: `Invitation sent to ${guest.name} (${guest.phone || guest.email || 'no contact'}) — RSVP link token: ${invitation.rsvpToken}`,
        type: 'system',
        data: { invitationId: invitation.id, channel: invitation.channel },
      });

      invitation.status = InvitationStatus.SENT;
      invitation.sentAt = sentAt;
      await this.invitationRepository.save(invitation);

      guest.invitationSent = true;
      guest.invitationSentAt = sentAt;
      await this.guestRepository.save(guest);
    }

    return { sent: invitations.length };
  }

  // ─── Public RSVP (guest-facing, via invitation token) ───

  async getInvitationByToken(token: string) {
    const invitation = await this.invitationRepository.findOne({ where: { rsvpToken: token } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.status === InvitationStatus.SENT || invitation.status === InvitationStatus.PENDING) {
      invitation.status = InvitationStatus.OPENED;
      invitation.openedAt = new Date().toISOString();
      await this.invitationRepository.save(invitation);
    }

    const event = await this.getEvent(invitation.eventId);
    const guest = await this.guestRepository.findOne({ where: { id: invitation.guestId } });

    return {
      invitation: {
        id: invitation.id,
        channel: invitation.channel,
        status: invitation.status,
        message: invitation.message,
      },
      event: {
        name: event.name,
        type: event.type,
        dateTime: event.dateTime,
        endTime: event.endTime,
        venue: event.venue,
        venueAddress: event.venueAddress,
        description: event.description,
      },
      guest: guest ? { name: guest.name, partySize: guest.partySize, rsvpStatus: guest.rsvpStatus } : null,
    };
  }

  async submitRsvpByToken(token: string, dto: PublicRsvpDto) {
    const invitation = await this.invitationRepository.findOne({ where: { rsvpToken: token } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    const guest = await this.guestRepository.findOne({ where: { id: invitation.guestId } });
    if (!guest) throw new NotFoundException('Guest not found');

    guest.rsvpStatus = dto.rsvpStatus;
    guest.rsvpMessage = dto.rsvpMessage || '';
    if (dto.attendingCount !== undefined) guest.partySize = dto.attendingCount;
    await this.guestRepository.save(guest);

    const rsvp = await this.rsvpRepository.save(this.rsvpRepository.create({
      eventId: invitation.eventId,
      guestId: guest.id,
      invitationId: invitation.id,
      rsvpStatus: dto.rsvpStatus,
      rsvpMessage: dto.rsvpMessage,
      attendingCount: dto.attendingCount ?? guest.partySize,
      respondedVia: 'link',
    }));

    invitation.status = InvitationStatus.RESPONDED;
    invitation.respondedAt = new Date().toISOString();
    await this.invitationRepository.save(invitation);

    await this.recomputeConfirmedGuests(invitation.eventId);

    return { message: 'RSVP recorded. Thank you!', rsvpStatus: rsvp.rsvpStatus };
  }

  async getRsvps(eventId: string) {
    const rsvps = await this.rsvpRepository.find({ where: { eventId }, order: { createdAt: 'DESC' } });
    const guests = await this.guestRepository.find({ where: { eventId } });
    const guestById = new Map(guests.map(g => [g.id, g]));
    return rsvps.map(r => ({ ...r, guestName: guestById.get(r.guestId)?.name || null }));
  }

  // ─── Dashboard ───

  async getDashboard(userId: string) {
    const events = await this.eventRepository.find({ where: { userId }, order: { dateTime: 'ASC' } });
    const eventIds = events.map(e => e.id);

    const guests = eventIds.length
      ? await this.guestRepository.find({ where: { eventId: In(eventIds) } })
      : [];
    const invitations = eventIds.length
      ? await this.invitationRepository.find({ where: { eventId: In(eventIds) } })
      : [];

    const now = new Date().toISOString();
    const upcoming = events.filter(e => e.dateTime >= now && e.status !== 'cancelled');

    const guestStats = {
      totalGuests: guests.length,
      totalHeadcount: guests.reduce((s, g) => s + g.partySize, 0),
      accepted: guests.filter(g => g.rsvpStatus === RsvpStatus.ACCEPTED).length,
      declined: guests.filter(g => g.rsvpStatus === RsvpStatus.DECLINED).length,
      maybe: guests.filter(g => g.rsvpStatus === RsvpStatus.MAYBE).length,
      pending: guests.filter(g => g.rsvpStatus === RsvpStatus.INVITED).length,
    };

    const invitationStats = {
      total: invitations.length,
      pending: invitations.filter(i => i.status === InvitationStatus.PENDING).length,
      sent: invitations.filter(i => i.status === InvitationStatus.SENT).length,
      opened: invitations.filter(i => i.status === InvitationStatus.OPENED).length,
      responded: invitations.filter(i => i.status === InvitationStatus.RESPONDED).length,
    };

    const guestsByEvent = new Map<string, GuestEntity[]>();
    guests.forEach(g => {
      if (!guestsByEvent.has(g.eventId)) guestsByEvent.set(g.eventId, []);
      guestsByEvent.get(g.eventId)!.push(g);
    });

    return {
      totalEvents: events.length,
      upcomingEvents: upcoming.length,
      nextEvent: upcoming[0] || null,
      budget: {
        totalBudget: events.reduce((s, e) => s + (e.budget || 0), 0),
        totalSpent: events.reduce((s, e) => s + (e.spent || 0), 0),
      },
      guestStats,
      invitationStats,
      events: events.map(e => {
        const eventGuests = guestsByEvent.get(e.id) || [];
        return {
          id: e.id,
          name: e.name,
          type: e.type,
          dateTime: e.dateTime,
          venue: e.venue,
          status: e.status,
          expectedGuests: e.expectedGuests,
          confirmedGuests: e.confirmedGuests,
          guestCount: eventGuests.length,
          acceptedCount: eventGuests.filter(g => g.rsvpStatus === RsvpStatus.ACCEPTED).length,
        };
      }),
    };
  }
}
