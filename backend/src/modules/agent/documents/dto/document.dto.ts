import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AgentDocumentType } from '../../common/enums/agent.enums';

export class UploadDocumentDto {
  @ApiProperty({ enum: AgentDocumentType })
  @IsEnum(AgentDocumentType)
  type!: AgentDocumentType;
}
