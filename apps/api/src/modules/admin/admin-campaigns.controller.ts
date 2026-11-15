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
import { AdminCampaignsService } from './admin-campaigns.service';
import { VerifyEscrowDto } from './dto/verify-escrow.dto';

@Controller('admin/campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCampaignsController {
  constructor(private readonly adminCampaignsService: AdminCampaignsService) {}

  @Get('pending-escrow')
  async listPending(@Query() query: PaginationQueryDto) {
    const { items, total } = await this.adminCampaignsService.listPendingEscrow(
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/admin/campaigns/pending-escrow',
    );
  }

  @Post(':id/verify-escrow')
  async verifyEscrow(
    @CurrentUser() user: AuthUser,
    @Param('id') campaignId: string,
    @Body() dto: VerifyEscrowDto,
  ) {
    const data = await this.adminCampaignsService.verifyEscrow(
      user.userId,
      campaignId,
      dto,
    );
    return { data };
  }
}
