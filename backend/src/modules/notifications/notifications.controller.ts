import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(
    @Query('userId') userId: number,
  ) {
    return this.notificationsService.findAll(Number(userId));
  }

  @Post()
  create(
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id')
  markRead(
    @Param('id') id: number,
  ) {
    return this.notificationsService.markAsRead(Number(id));
  }

  @Get('count')
  count(
    @Query('userId') userId: number,
  ) {
    return this.notificationsService.unreadCount(Number(userId));
  }
}