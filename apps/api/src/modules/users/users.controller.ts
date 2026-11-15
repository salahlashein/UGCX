import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UsersService } from './users.service';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { UpdateMeDto } from './dto/update-me.dto';

/** feature_mobile_app_phase1 addendum (Dependencies section, TASK-P1-013), TASK-W4-09. */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.usersService.getMe(user.userId);
    return { data };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMeDto,
  ) {
    const data = await this.usersService.updateMe(user.userId, dto);
    return { data };
  }

  @Post('me/push-token')
  @HttpCode(HttpStatus.OK)
  async registerPushToken(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePushTokenDto,
  ) {
    await this.usersService.updatePushToken(user.userId, dto.expoPushToken);
    return { data: { registered: true } };
  }

  @Delete('me/push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePushToken(@CurrentUser() user: AuthUser): Promise<void> {
    await this.usersService.clearPushToken(user.userId);
  }
}
