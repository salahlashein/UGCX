import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { paginate } from '../../common/utils/paginate';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { ListBriefQueryDto } from './dto/list-brief-query.dto';
import { FundEscrowDto } from './dto/fund-escrow.dto';
import { TopUpEscrowDto } from './dto/top-up-escrow.dto';
import { ManualEscrowPaymentDto } from './dto/manual-escrow-payment.dto';
import { CloseBriefDto } from './dto/close-brief.dto';
import { BrandRoleGuard } from '../brands/guards/brand-role.guard';
import { BrandRoles } from '../brands/decorators/brand-roles.decorator';
import { BrandMemberRole } from '../brands/entities/brand-member.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard, BrandRoleGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    const campaign = await this.campaignsService.create(user.userId, dto);
    return { data: campaign };
  }

  @Get('mine')
  @Roles(UserRole.BRAND)
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: ListBriefQueryDto,
  ) {
    const result = await this.campaignsService.listMine(user.userId, query);
    const paginated = paginate(
      result.items,
      result.total,
      query.page,
      query.perPage,
      '/api/v1/campaigns/mine',
    );
    return {
      ...paginated,
      counts: result.counts,
    };
  }

  @Get()
  @Roles(UserRole.CREATOR)
  async listLive(@Query() query: QueryCampaignDto) {
    const [items, total, facets] = await this.campaignsService.listLive(query);
    const paginated = paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/campaigns',
    );
    return {
      ...paginated,
      meta: {
        ...paginated.meta,
        facets,
      },
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.campaignsService.findOne(user, id);
    return { data: campaign };
  }

  @Patch(':id')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const campaign = await this.campaignsService.update(user.userId, id, dto);
    return { data: campaign };
  }

  @Post(':id/publish')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  @HttpCode(HttpStatus.OK)
  async publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.campaignsService.publish(user.userId, id);
    return { data: campaign };
  }

  @Post(':id/pause')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  @HttpCode(HttpStatus.OK)
  async pause(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.campaignsService.pause(user.userId, id);
    return { data: campaign };
  }

  @Post(':id/resume')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  @HttpCode(HttpStatus.OK)
  async resume(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.campaignsService.resume(user.userId, id);
    return { data: campaign };
  }

  @Post(':id/escrow/checkout')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  async fundEscrow(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: FundEscrowDto,
  ) {
    const result = await this.campaignsService.fundEscrow(user.userId, id, dto);
    return { data: result };
  }

  @Post(':id/escrow/manual-payment')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  async submitManualPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ManualEscrowPaymentDto,
  ) {
    const result = await this.campaignsService.submitManualPayment(
      user.userId,
      id,
      dto,
    );
    return { data: result };
  }

  @Post(':id/escrow/top-up')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  async topUpEscrow(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: TopUpEscrowDto,
  ) {
    const result = await this.campaignsService.topUpEscrow(
      user.userId,
      id,
      dto,
    );
    return { data: result };
  }

  @Post(':id/close')
  @Roles(UserRole.BRAND)
  @BrandRoles(BrandMemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  async close(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CloseBriefDto,
  ) {
    const result = await this.campaignsService.close(user.userId, id, dto);
    return { data: result };
  }

  @Get(':id/escrow')
  @Roles(UserRole.BRAND)
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async getEscrowBalance(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const balance = await this.campaignsService.getEscrowBalance(
      user.userId,
      id,
    );
    return { data: balance };
  }
}
