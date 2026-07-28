import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AgentActivityService } from './activity-log.service';

@ApiTags('Agent Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent')
export class AgentActivityController {
  constructor(private readonly activityService: AgentActivityService) {}

  @Get('activity')
  @ApiOperation({ summary: 'List agent activity log' })
  list(
    @Req() req: { user: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('customerId') customerId?: string,
  ) {
    return this.activityService.listForAgent(req.user.id, {
      page,
      limit,
      customerId,
    });
  }
}
