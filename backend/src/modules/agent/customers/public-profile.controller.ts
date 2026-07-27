import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentCustomersService } from './customers.service';

@ApiTags('Public Profiles')
@Controller('public')
export class PublicProfileController {
  constructor(
    private readonly customersService: AgentCustomersService,
  ) {}

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Public shared profile' })
  getPublicProfile(
    @Param('profileId') profileId: string,
  ) {
    return this.customersService.getPublicProfile(profileId);
  }
}