import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorDashboardService } from './vendor-dashboard.service';

@ApiTags('Vendor Dashboard')
@Controller('vendor')
export class VendorDashboardController {
  constructor(
    private readonly dashboardService: VendorDashboardService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vendor dashboard statistics',
  })
  async getDashboard(@Req() req: any) {
    return this.dashboardService.getDashboard(
      req.user.id,
    );
  }
}