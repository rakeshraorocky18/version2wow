import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AgentDashboardService } from './dashboard.service';

@ApiTags('Agent Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent')
export class AgentDashboardController {
  constructor(private readonly dashboardService: AgentDashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Agent CRM dashboard metrics' })
  getDashboard(@Req() req: { user: { id: string } }) {
    return this.dashboardService.getDashboard(req.user.id);
  }
}
