import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const page = query.page || 1;
    const perPage = query.perPage || 30;
    const unreadOnly = Boolean(query.unreadOnly);

    const result = await this.notificationsService.list(
      user.userId,
      page,
      perPage,
      unreadOnly,
    );

    return {
      data: result.data,
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    const unread = await this.notificationsService.unreadCount(user.userId);
    return { data: { unread } };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notificationsService.markRead(user.userId, id);
  }

  @Post('read-all')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: AuthUser) {
    const marked = await this.notificationsService.markAllRead(user.userId);
    return { data: { marked } };
  }
}
