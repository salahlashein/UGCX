import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { CreatorsService } from './creators.service';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { UpsertPayoutDetailsDto } from './dto/upsert-payout-details.dto';

@Controller('creators')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get('me')
  @Roles(UserRole.CREATOR)
  async getMe(@CurrentUser() user: AuthUser) {
    const creator = await this.creatorsService.findByUserId(user.userId);
    return { data: creator };
  }

  @Patch('me')
  @Roles(UserRole.CREATOR)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateCreatorDto) {
    const creator = await this.creatorsService.updateByUserId(user.userId, dto);
    return { data: creator };
  }

  @Get('me/portfolio-items')
  @Roles(UserRole.CREATOR)
  async listPortfolioItems(@CurrentUser() user: AuthUser) {
    const items = await this.creatorsService.listPortfolioItems(user.userId);
    return { data: items };
  }

  @Post('me/portfolio-items')
  @Roles(UserRole.CREATOR)
  async addPortfolioItem(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePortfolioItemDto,
  ) {
    const item = await this.creatorsService.addPortfolioItem(user.userId, dto);
    return { data: item };
  }

  @Put('me/payout-details')
  @Roles(UserRole.CREATOR)
  async upsertPayoutDetails(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertPayoutDetailsDto,
  ) {
    const details = await this.creatorsService.upsertPayoutDetailsForUser(
      user.userId,
      dto,
    );
    return { data: details };
  }

  // SEC-004: owner + admin only, enforced in the service.
  @Get(':id/payout-details')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  async getPayoutDetails(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const details = await this.creatorsService.getPayoutDetails(user, id);
    return { data: details };
  }

  @Get('me/queue')
  @Roles(UserRole.CREATOR)
  async getHomeQueue(@CurrentUser() user: AuthUser) {
    const queue = await this.creatorsService.getHomeQueue(user.userId);
    return { data: queue };
  }

  @Get('me/earnings')
  @Roles(UserRole.CREATOR)
  async getEarnings(@CurrentUser() user: AuthUser) {
    const earnings = await this.creatorsService.getEarnings(user.userId);
    return { data: earnings };
  }

  @Get('me/ledger')
  @Roles(UserRole.CREATOR)
  async getLedger(@CurrentUser() user: AuthUser) {
    const ledger = await this.creatorsService.getLedger(user.userId);
    return { data: ledger };
  }

  @Post('me/payout-requests')
  @Roles(UserRole.CREATOR)
  async requestPayout(
    @CurrentUser() user: AuthUser,
    @Body() dto: { amount: string; method: string },
  ) {
    const result = await this.creatorsService.requestPayout(
      user.userId,
      dto.amount,
      dto.method,
    );
    return { data: result };
  }
}
