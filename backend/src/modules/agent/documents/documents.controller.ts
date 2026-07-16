import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import {
  createDocFileFilter,
  createUploadStorage,
} from '../../../common/upload/upload.helpers';
import { AgentDocumentType } from '../common/enums/agent.enums';
import { AgentDocumentsService } from './documents.service';

@ApiTags('Agent Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT)
@Controller('agent/customers')
export class AgentDocumentsController {
  constructor(private readonly documentsService: AgentDocumentsService) {}

  @Get(':id/documents')
  @ApiOperation({ summary: 'List customer documents' })
  list(
    @Req() req: { user: { id: string } },
    @Param('id') customerId: string,
  ) {
    return this.documentsService.list(req.user.id, customerId);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a customer document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: Object.values(AgentDocumentType) },
        file: { type: 'string', format: 'binary' },
      },
      required: ['type', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createUploadStorage('agent-documents'),
      fileFilter: createDocFileFilter(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Req() req: { user: { id: string } },
    @Param('id') customerId: string,
    @Body('type') type: AgentDocumentType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!type || !Object.values(AgentDocumentType).includes(type)) {
      throw new BadRequestException('Valid document type is required');
    }
    return this.documentsService.upload(req.user.id, customerId, type, file);
  }
}
