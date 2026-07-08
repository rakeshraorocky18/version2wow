import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMeetingStatus, ChatRestrictionMode } from '../../../common/enums';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  receiverId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ default: 'text' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class UpdateChatPrivacyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowMessages?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowMediaSharing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowVoiceCalls?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowVideoCalls?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readReceipts?: boolean;

  @ApiPropertyOptional({ enum: ChatRestrictionMode })
  @IsOptional()
  @IsEnum(ChatRestrictionMode)
  chatRestriction?: ChatRestrictionMode;
}

export class ScheduleMeetingDto {
  @ApiProperty()
  @IsString()
  participantId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMeetingStatusDto {
  @ApiProperty({ enum: ChatMeetingStatus })
  @IsEnum(ChatMeetingStatus)
  status: ChatMeetingStatus;
}
