import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AgentAuthService } from './agent-auth.service';
import { AgentLoginDto, AgentRegisterDto } from './dto/agent-auth.dto';

@ApiTags('Agent Auth')
@Controller('agent')
export class AgentAuthController {
  constructor(private readonly agentAuthService: AgentAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Agent login' })
  login(@Body() dto: AgentLoginDto) {
    return this.agentAuthService.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new agent (bootstrap / admin use)' })
  register(@Body() dto: AgentRegisterDto) {
    return this.agentAuthService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current agent profile' })
  me(@Req() req: { user: { id: string } }) {
    return this.agentAuthService.getMe(req.user.id);
  }
}
