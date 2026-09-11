import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AdminCreatorsService } from './admin-creators.service';
import { VetCreatorDto } from './dto/vet-creator.dto';
import { ListCreatorsQueryDto } from './dto/list-creators-query.dto';

@Controller('admin/creators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCreatorsController {
  constructor(private readonly adminCreatorsService: AdminCreatorsService) {}

  @Get()
  async list(@Query() query: ListCreatorsQueryDto) {
    const [items, total] = await this.adminCreatorsService.list(
      query.vetting_status,
      query.page,
      query.perPage,
    );
    return paginate(
      items,
      total,
      query.page,
      query.perPage,
      '/api/v1/admin/creators',
    );
  }

  @Patch(':id/vetting')
  async vet(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VetCreatorDto,
  ) {
    const creator = await this.adminCreatorsService.vet(user.userId, id, dto);
    return { data: creator };
  }
}
