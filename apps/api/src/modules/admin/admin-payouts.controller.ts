import {
  Body,
  Controller,
  Get,
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
import { AdminPayoutsService } from './admin-payouts.service';
import { MarkPaidDto } from './dto/mark-paid.dto';

/** TASK-P1-010 */
@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPayoutsController {
  constructor(private readonly adminPayoutsService: AdminPayoutsService) {}

  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const [items, total] = await this.adminPayoutsService.list(
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/admin/payouts',
    );
  }

  @Post(':collaborationId/mark-paid')
  async markPaid(
    @CurrentUser() user: AuthUser,
    @Param('collaborationId') collaborationId: string,
    @Body() dto: MarkPaidDto,
  ) {
    const data = await this.adminPayoutsService.markPaid(
      user.userId,
      collaborationId,
      dto,
    );
    return { data };
  }
}
