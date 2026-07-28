import {
  Body,
  Controller,
  Delete,
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
import { AgentWorksheetService } from './worksheet.service';
import {
  CreateWorksheetDto,
  ListWorksheetQueryDto,
  UpdateWorksheetDto,
} from './dto/worksheet.dto';

@ApiTags('Agent Worksheet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent/worksheet')
export class AgentWorksheetController {
  constructor(private readonly worksheetService: AgentWorksheetService) {}

  @Get()
  @ApiOperation({ summary: 'List worksheet tasks' })
  list(
    @Req() req: { user: { id: string } },
    @Query() query: ListWorksheetQueryDto,
  ) {
    return this.worksheetService.list(req.user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create worksheet task' })
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateWorksheetDto,
  ) {
    return this.worksheetService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update worksheet task' })
  update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateWorksheetDto,
  ) {
    return this.worksheetService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete worksheet task' })
  remove(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.worksheetService.remove(req.user.id, id);
  }
}
