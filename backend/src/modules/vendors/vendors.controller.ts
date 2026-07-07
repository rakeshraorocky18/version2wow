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
import { VendorsServiceTypeorm } from './vendors.service.typeorm';
import { CreateVendorDto, CreateReviewDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorCategory } from '../../common/enums';




@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsServiceTypeorm) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my vendor profile" })
  async getMyVendor(@Req() req: any) {
    return this.vendorsService.getVendorByUserId(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register as a vendor' })
  async createVendor(@Req() req: any, @Body() dto: CreateVendorDto) {
    return this.vendorsService.createVendor(req.user.id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search vendors' })
  async searchVendors(
    @Query('category') category?: VendorCategory,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minRating') minRating?: number,
    @Query('search') search?: string,
    @Query('includeExternal') includeExternal?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const external = includeExternal === undefined ? true : includeExternal !== 'false';

    return this.vendorsService.searchVendors(
      { category, city, minPrice, maxPrice, minRating, search, includeExternal: external },
      page,
      limit,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured vendors' })
  async getFeaturedVendors(@Query('category') category?: VendorCategory) {
    return this.vendorsService.getFeaturedVendors(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details' })
  async getVendor(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor profile' })
  async updateVendor(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateVendorDto>,
  ) {
    return this.vendorsService.updateVendor(req.user.id, id, dto);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review' })
  async addReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.vendorsService.addReview(req.user.id, id, dto);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get vendor reviews' })
  async getReviews(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.vendorsService.getReviews(id, page, limit);
  }
}
