import {
  Body,
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
import { SendMessageDto } from './dto/send-message.dto';

@Controller('collaborations/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRAND, UserRole.CREATOR)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /** TASK-P1-009 */
  @Post('chat-token')
  @HttpCode(HttpStatus.OK)
  async chatToken(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tokenRequest = await this.messagesService.createChatToken(user, id);
    return { data: tokenRequest };
  }

  @Get('messages')
  async list(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const [items, total] = await this.messagesService.list(
      user,
      id,
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      `/api/v1/collaborations/${id}/messages`,
    );
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.messagesService.create(user, id, dto.body);
    return { data: message };
  }
}
