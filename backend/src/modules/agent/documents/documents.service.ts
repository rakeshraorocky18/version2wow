import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { toPublicUrl } from '../../../common/upload/upload.helpers';
import { AgentDocumentEntity } from '../common/entities/agent-document.entity';
import { AgentActivityAction, AgentDocumentType } from '../common/enums/agent.enums';
import { AgentActivityService } from '../activity-log/activity-log.service';
import { AgentCustomersService } from '../customers/customers.service';

@Injectable()
export class AgentDocumentsService {
  constructor(
    @InjectRepository(AgentDocumentEntity, POSTGRES_CONNECTION)
    private readonly documentRepo: Repository<AgentDocumentEntity>,
    private readonly customersService: AgentCustomersService,
    private readonly activityService: AgentActivityService,
  ) {}

  async list(agentId: string, customerId: string) {
    await this.customersService.findAssignedOrFail(agentId, customerId);
    return this.documentRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async upload(
    agentId: string,
    customerId: string,
    type: AgentDocumentType,
    file: Express.Multer.File,
  ) {
    await this.customersService.findAssignedOrFail(agentId, customerId);

    const fileUrl = toPublicUrl(`agent-documents/${file.filename}`);
    const doc = await this.documentRepo.save(
      this.documentRepo.create({
        customerId,
        agentId,
        type,
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
      }),
    );

    await this.customersService.refreshCompletion(customerId);

    await this.activityService.log({
      agentId,
      customerId,
      action: AgentActivityAction.DOCUMENT_UPLOADED,
      description: `Uploaded ${type} document (${file.originalname})`,
    });

    return doc;
  }
}
