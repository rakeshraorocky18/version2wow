import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AgentNotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@ApiTags('Agent Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent')
export class AgentNotesController {
  constructor(private readonly notesService: AgentNotesService) {}

  @Get('customers/:id/notes')
  @ApiOperation({ summary: 'List notes for a customer' })
  list(
    @Req() req: { user: { id: string } },
    @Param('id') customerId: string,
  ) {
    return this.notesService.list(req.user.id, customerId);
  }

  @Post('customers/:id/notes')
  @ApiOperation({ summary: 'Add a note to a customer' })
  create(
    @Req() req: { user: { id: string } },
    @Param('id') customerId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.create(req.user.id, customerId, dto);
  }

  @Patch('notes/:id')
  @ApiOperation({ summary: 'Update a note' })
  update(
    @Req() req: { user: { id: string } },
    @Param('id') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(req.user.id, noteId, dto);
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Delete a note' })
  remove(
    @Req() req: { user: { id: string } },
    @Param('id') noteId: string,
  ) {
    return this.notesService.remove(req.user.id, noteId);
  }
}
