import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CleanupAadhaarSessionDto {
  @ApiProperty({ example: 'sess-abc123', description: 'Verification session identifier' })
  @IsString()
  sessionId!: string;
}
