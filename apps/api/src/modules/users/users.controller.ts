import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UsersService } from './users.service';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

/** feature_mobile_app_phase1 addendum (Dependencies section, TASK-P1-013). */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/push-token')
  @HttpCode(HttpStatus.OK)
  async registerPushToken(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePushTokenDto,
  ) {
    await this.usersService.updatePushToken(user.userId, dto.expoPushToken);
    return { data: { registered: true } };
  }
}
