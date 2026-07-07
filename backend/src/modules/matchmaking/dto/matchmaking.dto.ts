import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendInterestDto {
  @ApiProperty({ description: 'Profile ID of the person to send interest to' })
  @IsString()
  receiverId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
