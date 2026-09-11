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
import { CollaborationsService } from './collaborations.service';
import { AcceptProposalDto } from './dto/accept-proposal.dto';
import { ConfirmShipmentDto } from './dto/confirm-shipment.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  /**
   * feature_mobile_app_phase1 addendum: backs REQ-005's status poll and
   * both brand/creator collaboration-detail screens. Not part of the
   * original escrow/payments plan's controller, but the ownership checks
   * it calls (findOwnedByBrand/findOwnedByCreator) already existed there.
   */
  @Get('collaborations/mine')
  @Roles(UserRole.BRAND, UserRole.CREATOR)
  async listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const [items, total] = await this.collaborationsService.listMine(
      user,
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/collaborations/mine',
    );
  }

  /** feature_mobile_app_phase1 addendum: see listMine above. */
  @Get('collaborations/:id')
  @Roles(UserRole.BRAND, UserRole.CREATOR)
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const collaboration = await this.collaborationsService.findOwnedByUser(
      user,
      id,
    );
    return { data: collaboration };
  }

  /** TASK-P1-004 */
  @Post('proposals/:id/accept')
  @Roles(UserRole.BRAND)
  @HttpCode(HttpStatus.CREATED)
  async accept(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() _dto: AcceptProposalDto,
  ) {
    const { collaboration, checkoutUrl } =
      await this.collaborationsService.acceptProposal(user.userId, id);
    return {
      data: {
        collaborationId: collaboration.id,
        status: collaboration.status,
        checkoutUrl,
      },
    };
  }

  /** TASK-P1-006 */
  @Post('collaborations/:id/confirm-shipment')
  @Roles(UserRole.BRAND)
  async confirmShipment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmShipmentDto,
  ) {
    const collaboration = await this.collaborationsService.confirmShipment(
      user.userId,
      id,
      dto,
    );
    return { data: collaboration };
  }
}
