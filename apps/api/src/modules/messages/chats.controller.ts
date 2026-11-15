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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/utils/paginate';
import { MessagesService } from './messages.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRAND, UserRole.CREATOR)
export class ChatsController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * TASK-P3-07: GET /api/v1/chats
   */
  @Get('chats')
  async listChats(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const [items, total] = await this.messagesService.listChats(
      user,
      query.page,
      query.perPage,
    );
    return paginate(items, total, query.page, query.perPage, '/api/v1/chats');
  }

  /**
   * TASK-P3-07: POST /api/v1/collaborations/:id/read
   */
  @Post('collaborations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.messagesService.markRead(user, id);
  }
}
