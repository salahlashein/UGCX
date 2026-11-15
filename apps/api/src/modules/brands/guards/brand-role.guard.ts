import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BRAND_ROLES_KEY } from '../decorators/brand-roles.decorator';
import { BrandMemberRole } from '../entities/brand-member.entity';
import { BrandsService, ActingBrand } from '../brands.service';
import { UserRole } from '../../users/entities/user.entity';
import { DomainErrorException } from '../../../common/exceptions/domain-error.exception';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

@Injectable()
export class BrandRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly brandsService: BrandsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<BrandMemberRole[]>(
      BRAND_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      actingBrand?: ActingBrand;
    }>();

    const user = request.user;
    if (!user || user.role !== UserRole.BRAND) {
      return true;
    }

    const actingBrand = await this.brandsService.resolveActingBrand(
      user.userId,
    );
    if (!requiredRoles.includes(actingBrand.memberRole)) {
      throw new DomainErrorException(
        HttpStatus.FORBIDDEN,
        'brand_role_forbidden',
        'Your team role does not allow this action',
      );
    }

    request.actingBrand = actingBrand;
    return true;
  }
}
