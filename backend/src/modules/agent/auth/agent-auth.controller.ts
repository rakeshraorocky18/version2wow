import { Body, Controller, Get, Patch, Post, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { createUploadStorage, createImageFileFilter, toPublicUrl } from '../../../common/upload/upload.helpers';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AgentAuthService } from './agent-auth.service';
import { AgentLoginDto, AgentRegisterDto, UpdateAgentProfileDto, ChangeAgentPasswordDto } from './dto/agent-auth.dto';

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

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current agent profile' })
  updateProfile(@Req() req: { user: { id: string } }, @Body() dto: UpdateAgentProfileDto) {
    return this.agentAuthService.updateProfile(req.user.id, dto);
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload agent profile photo' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: createUploadStorage('agent-profiles'),
      fileFilter: createImageFileFilter(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProfilePhoto(
    @Req() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }
    const url = toPublicUrl(`agent-profiles/${file.filename}`);
    const profile = await this.agentAuthService.updateProfilePhoto(req.user.id, url);
    return { url, profile };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change agent password' })
  changePassword(@Req() req: { user: { id: string } }, @Body() dto: ChangeAgentPasswordDto) {
    return this.agentAuthService.changePassword(req.user.id, dto);
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate current agent account' })
  deactivate(@Req() req: { user: { id: string } }) {
    return this.agentAuthService.deactivate(req.user.id);
  }
}
