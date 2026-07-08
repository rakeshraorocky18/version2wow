import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto, UpdateBookingStatusDto,
  InitiatePaymentDto, ConfirmPaymentDto, RefundDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingStatus } from '../../common/enums';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking request' })
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings' })
  async getMyBookings(@Req() req: any, @Query('status') status?: BookingStatus) {
    return this.bookingsService.getUserBookings(req.user.id, status);
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get bookings for a vendor' })
  async getVendorBookings(@Param('vendorId') vendorId: string, @Query('status') status?: BookingStatus) {
    return this.bookingsService.getVendorBookings(vendorId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateBookingStatus(id, req.user.id, dto);
  }

  // ─── Payments ───

  @Post('payments/initiate')
  @ApiOperation({ summary: 'Initiate a payment' })
  async initiatePayment(@Req() req: any, @Body() dto: InitiatePaymentDto) {
    return this.bookingsService.initiatePayment(req.user.id, dto);
  }

  @Put('payments/:id/confirm')
  @ApiOperation({ summary: 'Confirm payment with transaction details' })
  async confirmPayment(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.bookingsService.confirmPayment(id, dto);
  }

  @Put('payments/:id/release-escrow')
  @ApiOperation({ summary: 'Release escrow payment to vendor' })
  async releaseEscrow(@Param('id') id: string) {
    return this.bookingsService.releaseEscrow(id);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  async refund(@Param('id') id: string, @Body() dto: RefundDto) {
    return this.bookingsService.refundPayment(id, dto);
  }

  @Get(':bookingId/payments')
  @ApiOperation({ summary: 'Get payments for a booking' })
  async getBookingPayments(@Param('bookingId') bookingId: string) {
    return this.bookingsService.getPaymentsByBooking(bookingId);
  }

  @Get('payments/history')
  @ApiOperation({ summary: 'Payment history' })
  async paymentHistory(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.bookingsService.getPaymentHistory(req.user.id, page, limit);
  }
}
