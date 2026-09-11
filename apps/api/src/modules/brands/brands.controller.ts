import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { BrandsService } from './brands.service';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRAND)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const brand = await this.brandsService.findByUserId(user.userId);
    return { data: brand };
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.updateByUserId(user.userId, dto);
    return { data: brand };
  }
}
