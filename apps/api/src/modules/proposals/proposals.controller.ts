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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/utils/paginate';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { BrandRoleGuard } from '../brands/guards/brand-role.guard';
import { BrandRoles } from '../brands/decorators/brand-roles.decorator';
import { BrandMemberRole } from '../brands/entities/brand-member.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('campaigns/:campaignId/proposals')
  @Roles(UserRole.CREATOR)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateProposalDto,
  ) {
    const proposal = await this.proposalsService.create(
      user.userId,
      campaignId,
      dto,
    );
    return { data: proposal };
  }

  @Get('campaigns/:campaignId/proposals')
  @Roles(UserRole.BRAND)
  async listForCampaign(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const [items, total] = await this.proposalsService.listForCampaign(
      user.userId,
      campaignId,
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      `/api/v1/campaigns/${campaignId}/proposals`,
    );
  }

  @Get('proposals/mine')
  @Roles(UserRole.CREATOR)
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const [items, total] = await this.proposalsService.listMine(
      user.userId,
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/proposals/mine',
    );
  }

  @Patch('proposals/:id/status')
  @Roles(UserRole.BRAND)
  @UseGuards(BrandRoleGuard)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    const proposal = await this.proposalsService.updateStatus(
      user.userId,
      id,
      dto.status,
    );
    return { data: proposal };
  }

  /** REQ-213, TASK-P2-11: Creator trust preview */
  @Get('proposals/:id/creator-profile')
  @Roles(UserRole.BRAND)
  @UseGuards(BrandRoleGuard)
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async getCreatorProfile(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const profile = await this.proposalsService.getCreatorProfilePreview(
      user.userId,
      id,
    );
    return { data: profile };
  }

  /** BG-22, TASK-W3-05: Proposal accept quote */
  @Get('proposals/:id/quote')
  @Roles(UserRole.BRAND)
  @UseGuards(BrandRoleGuard)
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async getAcceptQuote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const quote = await this.proposalsService.getAcceptQuote(
      user.userId,
      id,
    );
    return { data: quote };
  }
}
