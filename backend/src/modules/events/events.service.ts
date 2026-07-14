import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity, GuestEntity } from './entities/event.entity';
import { CreateEventDto, AddGuestDto, UpdateRsvpDto, AssignSeatDto } from './dto/event.dto';
import { RsvpStatus } from '../../common/enums';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity, POSTGRES_CONNECTION)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(GuestEntity, POSTGRES_CONNECTION)
    private guestRepository: Repository<GuestEntity>,
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

    // Update confirmed count
    const event = await this.getEvent(guest.eventId);
    const confirmedGuests = await this.guestRepository.find({
      where: { eventId: guest.eventId, rsvpStatus: RsvpStatus.ACCEPTED },
    });
    event.confirmedGuests = confirmedGuests.reduce((s, g) => s + g.partySize, 0);
    await this.eventRepository.save(event);

    return saved;
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
}
