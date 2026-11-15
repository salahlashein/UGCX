import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { BrandsService } from './brands.service';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandRoleGuard } from './guards/brand-role.guard';
import { BrandRoles } from './decorators/brand-roles.decorator';
import { BrandMemberRole } from './entities/brand-member.entity';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { BillingQueryDto } from './dto/billing-query.dto';
import { paginate } from '../../common/utils/paginate';
import { BillingService } from './billing.service';
import { DashboardService } from './dashboard.service';

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard, BrandRoleGuard)
@Roles(UserRole.BRAND)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly billingService: BillingService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('me/dashboard')
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async getDashboard(@CurrentUser() user: AuthUser) {
    const data = await this.dashboardService.getDashboard(user.userId);
    return { data };
  }

  @Get('me')
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async getMe(@CurrentUser() user: AuthUser) {
    const brand = await this.brandsService.getMeWithRole(user.userId);
    return { data: brand };
  }

  @Get('me/stats')
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async getStats(@CurrentUser() user: AuthUser) {
    const stats = await this.brandsService.getBrandStats(user.userId);
    return { data: stats };
  }

  @Patch('me')
  @BrandRoles(BrandMemberRole.OWNER)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.updateByUserId(user.userId, dto);
    return { data: brand };
  }

  @Get('me/billing')
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  async getBilling(
    @CurrentUser() user: AuthUser,
    @Query() query: BillingQueryDto,
  ) {
    const { items, total, summary } = await this.billingService.list(
      user.userId,
      query.page,
      query.perPage,
      query.type,
    );
    const envelope = paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/brands/me/billing',
    );
    return {
      ...envelope,
      summary,
    };
  }
}
