import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AgentCustomersService } from './customers.service';
import {
  CreateAgentCustomerDto,
  ListCustomersQueryDto,
  UpdateAgentCustomerDto,
} from './dto/customer.dto';
import { MatchingSearchDto } from './dto/matching.dto';

@ApiTags('Agent Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent/customers')
export class AgentCustomersController {
  constructor(private readonly customersService: AgentCustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers assigned to the agent' })
  list(
    @Req() req: { user: { id: string } },
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersService.list(req.user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Onboard a new customer' })
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateAgentCustomerDto,
  ) {
    return this.customersService.create(req.user.id, dto);
  }

  @Post(':customerId/matching/search')
  @ApiOperation({ summary: 'Search matching profiles for a customer' })
  searchMatches(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Body() dto: MatchingSearchDto,
  ) {
    return this.customersService.searchMatches(req.user.id, customerId, dto);
  }

  @Get(':customerId/matching/recommendations')
  @ApiOperation({ summary: 'AI suggested profiles for a customer' })
  getRecommendations(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.getRecommendations(req.user.id, customerId);
  }

  @Get(':customerId/matching/profiles/:matchedProfileId')
  @ApiOperation({
    summary: 'Full matched profile detail (platform-wide, for matchmaking)',
  })
  getMatchProfile(
    @Req() req: { user: { id: string } },
    @Param('customerId') customerId: string,
    @Param('matchedProfileId') matchedProfileId: string,
  ) {
    return this.customersService.getMatchProfile(
      req.user.id,
      customerId,
      matchedProfileId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  getOne(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.customersService.getOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAgentCustomerDto,
  ) {
    return this.customersService.update(req.user.id, id, dto);
  }
}
