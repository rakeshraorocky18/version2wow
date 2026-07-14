import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AgentNoteEntity } from '../common/entities/agent-note.entity';
import { AgentProfileEntity } from '../common/entities/agent-profile.entity';
import { AgentActivityAction } from '../common/enums/agent.enums';
import { AgentActivityService } from '../activity-log/activity-log.service';
import { AgentCustomersService } from '../customers/customers.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class AgentNotesService {
  constructor(
    @InjectRepository(AgentNoteEntity, POSTGRES_CONNECTION)
    private readonly noteRepo: Repository<AgentNoteEntity>,
    @InjectRepository(AgentProfileEntity, POSTGRES_CONNECTION)
    private readonly agentProfileRepo: Repository<AgentProfileEntity>,
    private readonly customersService: AgentCustomersService,
    private readonly activityService: AgentActivityService,
  ) {}

  async list(agentId: string, customerId: string) {
    await this.customersService.findAssignedOrFail(agentId, customerId);
    const notes = await this.noteRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });

    const agentIds = [...new Set(notes.map((n) => n.agentId))];
    const profiles = agentIds.length
      ? await this.agentProfileRepo
          .createQueryBuilder('p')
          .where('p.userId IN (:...ids)', { ids: agentIds })
          .getMany()
      : [];
    const profileMap = new Map(
      profiles.map((p) => [
        p.userId,
        [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Agent',
      ]),
    );

    return notes.map((note) => ({
      ...note,
      agentName: profileMap.get(note.agentId) ?? 'Agent',
    }));
  }

  async create(agentId: string, customerId: string, dto: CreateNoteDto) {
    await this.customersService.findAssignedOrFail(agentId, customerId);
    const note = await this.noteRepo.save(
      this.noteRepo.create({
        customerId,
        agentId,
        content: dto.content,
      }),
    );

    await this.activityService.log({
      agentId,
      customerId,
      action: AgentActivityAction.NOTE_ADDED,
      description: 'Note added to customer profile',
    });

    return note;
  }

  async update(agentId: string, noteId: string, dto: UpdateNoteDto) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.agentId !== agentId) {
      throw new ForbiddenException('You can only edit your own notes');
    }
    await this.customersService.findAssignedOrFail(agentId, note.customerId);

    Object.assign(note, dto);
    const saved = await this.noteRepo.save(note);

    await this.activityService.log({
      agentId,
      customerId: note.customerId,
      action: AgentActivityAction.NOTE_UPDATED,
      description: 'Note updated',
    });

    return saved;
  }

  async remove(agentId: string, noteId: string) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.agentId !== agentId) {
      throw new ForbiddenException('You can only delete your own notes');
    }
    await this.customersService.findAssignedOrFail(agentId, note.customerId);
    await this.noteRepo.remove(note);

    await this.activityService.log({
      agentId,
      customerId: note.customerId,
      action: AgentActivityAction.NOTE_DELETED,
      description: 'Note deleted',
    });

    return { message: 'Note deleted' };
  }
}
