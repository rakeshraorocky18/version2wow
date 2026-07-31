import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    if (!isUUID(userId)) {
      throw new BadRequestException('Invalid userId. Must be a valid UUID.');
    }
    return this.notificationsService.findAll(userId);
  }

  @Post()
  create(
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id')
  markRead(
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(Number(id));
  }

  @Get('count')
  async count(
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    if (!isUUID(userId)) {
      throw new BadRequestException('Invalid userId. Must be a valid UUID.');
    }
    const count = await this.notificationsService.unreadCount(userId);
    return { count };
  }
}