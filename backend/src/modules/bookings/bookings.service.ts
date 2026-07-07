import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity, PaymentEntity } from './entities/booking.entity';
import { CreateBookingDto, UpdateBookingStatusDto, InitiatePaymentDto, ConfirmPaymentDto, RefundDto } from './dto/booking.dto';
import { BookingStatus, PaymentStatus } from '../../common/enums';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
  ) {}

  // ─── Bookings ───

  async createBooking(userId: string, dto: CreateBookingDto): Promise<BookingEntity> {
    const booking = this.bookingRepository.create({
      userId,

      vendorId: dto.vendorId,
      vendorName: dto.vendorName,

      serviceDescription: dto.serviceDescription,

      eventType: dto.eventType,
      eventDate: dto.eventDate,
      eventTime: dto.eventTime,

      venue: dto.venue,
      city: dto.city,

      guestCount: dto.guestCount,

      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,

      specialRequirements: dto.specialRequirements,

      amount: dto.amount,
      advancePaid: dto.advancePaid ?? 0,
      balanceDue: dto.amount - (dto.advancePaid ?? 0),

      userNotes: dto.userNotes,

      status: BookingStatus.REQUESTED,
    });
    return this.bookingRepository.save(booking);
  }

  async getBooking(id: string): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getUserBookings(userId: string, status?: BookingStatus) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.bookingRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async getVendorBookings(vendorId: string, status?: BookingStatus) {
    const where: any = { vendorId };
    if (status) where.status = status;
    return this.bookingRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateBookingStatus(id: string, userId: string, dto: UpdateBookingStatusDto): Promise<BookingEntity> {
    const booking = await this.getBooking(id);

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      [BookingStatus.REQUESTED]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],

      [BookingStatus.CONFIRMED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${booking.status} to ${dto.status}`);
    }

    booking.status = dto.status;
    if (dto.notes) booking.vendorNotes = dto.notes;
    if (dto.cancellationReason) booking.cancellationReason = dto.cancellationReason;

    return this.bookingRepository.save(booking);
  }

  // ─── Payments ───

  async initiatePayment(userId: string, dto: InitiatePaymentDto): Promise<PaymentEntity> {
    const booking = await this.getBooking(dto.bookingId);
    if (booking.userId !== userId) throw new BadRequestException('Not your booking');

    const payment = this.paymentRepository.create({
      bookingId: dto.bookingId,
      userId,
      vendorId: booking.vendorId,
      amount: dto.amount,
      method: dto.method,
      isEscrow: dto.isEscrow || false,
      status: PaymentStatus.PROCESSING,
    });

    return this.paymentRepository.save(payment);
  }

  async confirmPayment(paymentId: string, dto: ConfirmPaymentDto): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.transactionId = dto.transactionId;
    payment.gatewayOrderId = dto.gatewayOrderId || '';
    payment.status = payment.isEscrow ? PaymentStatus.HELD_IN_ESCROW : PaymentStatus.RELEASED;

    await this.paymentRepository.save(payment);

    // Update booking amounts
    const booking = await this.getBooking(payment.bookingId);
    booking.advancePaid += payment.amount;
    booking.balanceDue = booking.amount - booking.advancePaid;
    await this.bookingRepository.save(booking);

    return payment;
  }

  async releaseEscrow(paymentId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.HELD_IN_ESCROW) {
      throw new BadRequestException('Payment is not in escrow');
    }

    payment.status = PaymentStatus.RELEASED;
    payment.escrowReleaseDate = new Date().toISOString();
    return this.paymentRepository.save(payment);
  }

  async refundPayment(paymentId: string, dto: RefundDto): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (dto.amount > payment.amount) throw new BadRequestException('Refund exceeds payment amount');

    payment.status = PaymentStatus.REFUNDED;
    payment.refundAmount = dto.amount;
    payment.refundReason = dto.reason;
    await this.paymentRepository.save(payment);

    // Update booking
    const booking = await this.getBooking(payment.bookingId);
    booking.advancePaid -= dto.amount;
    booking.balanceDue = booking.amount - booking.advancePaid;
    await this.bookingRepository.save(booking);

    return payment;
  }

  async getPaymentsByBooking(bookingId: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({ where: { bookingId }, order: { createdAt: 'DESC' } });
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { payments, total, page, totalPages: Math.ceil(total / limit) };
  }
}
