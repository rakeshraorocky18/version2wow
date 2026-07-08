import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HoneymoonService } from './honeymoon.service';
import { CreatePackageDto, BookPackageDto } from './dto/honeymoon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HoneymoonPackageType } from '../../common/enums';

@ApiTags('honeymoon')
@Controller('honeymoon')
export class HoneymoonController {
  constructor(private readonly honeymoonService: HoneymoonService) {}

  // ─── Packages (public browsing) ───

  @Get('packages')
  @ApiOperation({ summary: 'Search honeymoon packages' })
  async searchPackages(
    @Query('destination') destination?: string,
    @Query('type') type?: HoneymoonPackageType,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minDuration') minDuration?: number,
    @Query('maxDuration') maxDuration?: number,
    @Query('includeExternal') includeExternal?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const external = includeExternal === undefined ? true : includeExternal !== 'false';

    return this.honeymoonService.searchPackages({
      destination,
      type,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      includeExternal: external,
      page,
      limit,
    });
  }

  @Get('packages/featured')
  @ApiOperation({ summary: 'Get featured packages' })
  async getFeatured() {
    return this.honeymoonService.getFeaturedPackages();
  }

  @Get('destinations')
  @ApiOperation({ summary: 'Get popular honeymoon destinations' })
  async getDestinations() {
    return this.honeymoonService.getPopularDestinations();
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get package details' })
  async getPackage(@Param('id') id: string) {
    return this.honeymoonService.getPackage(id);
  }

  // ─── Package management (vendors) ───

  @Post('packages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a honeymoon package (vendor)' })
  async createPackage(@Req() req: any, @Body() dto: CreatePackageDto) {
    return this.honeymoonService.createPackage(req.user.id, dto);
  }

  // ─── Bookings ───

  @Post('book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a honeymoon package' })
  async book(@Req() req: any, @Body() dto: BookPackageDto) {
    return this.honeymoonService.bookPackage(req.user.id, dto);
  }

  @Get('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my honeymoon bookings' })
  async getMyBookings(@Req() req: any) {
    return this.honeymoonService.getUserBookings(req.user.id);
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking details' })
  async getBooking(@Param('id') id: string) {
    return this.honeymoonService.getBooking(id);
  }

  @Put('bookings/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.honeymoonService.updateBookingStatus(id, status);
  }

  @Put('bookings/:id/itinerary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save itinerary for a booking' })
  async saveItinerary(@Param('id') id: string, @Body() itinerary: object) {
    return this.honeymoonService.saveItinerary(id, itinerary);
  }
}
