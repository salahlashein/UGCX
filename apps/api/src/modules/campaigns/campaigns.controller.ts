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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(UserRole.BRAND)
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    const campaign = await this.campaignsService.create(user.userId, dto);
    return { data: campaign };
  }

  @Get('mine')
  @Roles(UserRole.BRAND)
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const [items, total] = await this.campaignsService.listMine(
      user.userId,
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/campaigns/mine',
    );
  }

  @Get()
  @Roles(UserRole.CREATOR)
  async listLive(@Query() query: QueryCampaignDto) {
    const [items, total] = await this.campaignsService.listLive(query);
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/campaigns',
    );
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.campaignsService.findOne(user, id);
    return { data: campaign };
  }

  @Patch(':id')
  @Roles(UserRole.BRAND)
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
  @HttpCode(HttpStatus.OK)
  async publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const campaign = await this.campaignsService.publish(user.userId, id);
    return { data: campaign };
  }
}
