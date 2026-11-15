import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { BrandRoleGuard } from '../brands/guards/brand-role.guard';
import { BrandRoles } from '../brands/decorators/brand-roles.decorator';
import { BrandMemberRole } from '../brands/entities/brand-member.entity';
import { DeliverablesService } from './deliverables.service';
import { RegisterDeliverableDto } from './dto/register-deliverable.dto';
import { ReviewDeliverableDto } from './dto/review-deliverable.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  /** TASK-P1-007 */
  @Post('collaborations/:id/deliverables')
  @Roles(UserRole.CREATOR)
  @HttpCode(HttpStatus.CREATED)
  async register(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RegisterDeliverableDto,
  ) {
    const deliverable = await this.deliverablesService.register(
      user.userId,
      id,
      dto,
    );
    return { data: deliverable };
  }

  /** feature_mobile_app_phase1 addendum: see DeliverablesService.listForCollaboration. */
  @Get('collaborations/:id/deliverables')
  @Roles(UserRole.BRAND, UserRole.CREATOR)
  async listForCollaboration(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const deliverables = await this.deliverablesService.listForCollaboration(
      user,
      id,
    );
    return { data: deliverables };
  }

  /** TASK-P1-008, TASK-P3-02: brand owner or approver only */
  @Post('deliverables/:id/review')
  @Roles(UserRole.BRAND)
  @UseGuards(BrandRoleGuard)
  @BrandRoles(BrandMemberRole.OWNER, BrandMemberRole.APPROVER)
  async review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewDeliverableDto,
  ) {
    const data = await this.deliverablesService.review(user.userId, id, dto);
    return { data };
  }
}
