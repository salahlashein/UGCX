import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BrandRoleGuard } from './guards/brand-role.guard';
import { BrandRoles } from './decorators/brand-roles.decorator';
import { BrandMember, BrandMemberRole } from './entities/brand-member.entity';
import { BrandMembersService } from './brand-members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import type { ActingBrand } from './brands.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('brands/me/members')
@UseGuards(JwtAuthGuard, RolesGuard, BrandRoleGuard)
@Roles(UserRole.BRAND)
export class BrandMembersController {
  constructor(private readonly brandMembersService: BrandMembersService) {}

  @Get()
  @BrandRoles(
    BrandMemberRole.OWNER,
    BrandMemberRole.APPROVER,
    BrandMemberRole.VIEWER,
  )
  async list(
    @Req() req: { user: AuthUser; actingBrand: ActingBrand },
  ): Promise<{ data: Record<string, unknown>[] }> {
    const data = await this.brandMembersService.list(
      req.actingBrand.brand.id,
      req.actingBrand.memberRole,
      req.user.userId,
    );
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @BrandRoles(BrandMemberRole.OWNER)
  async invite(
    @Req() req: { user: AuthUser; actingBrand: ActingBrand },
    @Body() dto: InviteMemberDto,
  ): Promise<{ data: BrandMember }> {
    const data = await this.brandMembersService.invite(
      req.actingBrand.brand.id,
      req.user.userId,
      dto,
    );
    return { data };
  }

  @Patch(':id')
  @BrandRoles(BrandMemberRole.OWNER)
  async updateRole(
    @Req() req: { actingBrand: ActingBrand },
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<{ data: BrandMember }> {
    const data = await this.brandMembersService.updateRole(
      req.actingBrand.brand.id,
      id,
      dto,
    );
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @BrandRoles(BrandMemberRole.OWNER)
  async remove(
    @Req() req: { actingBrand: ActingBrand },
    @Param('id') id: string,
  ): Promise<void> {
    await this.brandMembersService.remove(req.actingBrand.brand.id, id);
  }

  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  @BrandRoles(BrandMemberRole.OWNER)
  async resend(
    @Req() req: { actingBrand: ActingBrand },
    @Param('id') id: string,
  ): Promise<{ data: BrandMember }> {
    const data = await this.brandMembersService.resendInvite(
      req.actingBrand.brand.id,
      id,
    );
    return { data };
  }
}
