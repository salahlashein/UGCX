import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BrandRoleGuard } from './brand-role.guard';
import { BrandsService } from '../brands.service';
import { BrandMemberRole } from '../entities/brand-member.entity';
import { UserRole } from '../../users/entities/user.entity';
import { DomainErrorException } from '../../../common/exceptions/domain-error.exception';

describe('BrandRoleGuard', () => {
  let guard: BrandRoleGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let brandsService: { resolveActingBrand: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    brandsService = { resolveActingBrand: jest.fn() };
    guard = new BrandRoleGuard(
      reflector as unknown as Reflector,
      brandsService as unknown as BrandsService,
    );
  });

  function createMockContext(user?: any): {
    context: ExecutionContext;
    request: any;
  } {
    const request = { user };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('no metadata returns true without a database read', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const { context } = createMockContext({
      userId: 'user-1',
      role: UserRole.BRAND,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(brandsService.resolveActingBrand).not.toHaveBeenCalled();
  });

  it('an owner passes an owner only route', async () => {
    reflector.getAllAndOverride.mockReturnValue([BrandMemberRole.OWNER]);
    const { context, request } = createMockContext({
      userId: 'user-owner',
      role: UserRole.BRAND,
    });
    brandsService.resolveActingBrand.mockResolvedValue({
      brand: { id: 'brand-1' },
      memberRole: BrandMemberRole.OWNER,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.actingBrand).toEqual({
      brand: { id: 'brand-1' },
      memberRole: BrandMemberRole.OWNER,
    });
  });

  it('a viewer on an owner route throws with code brand_role_forbidden and status 403', async () => {
    reflector.getAllAndOverride.mockReturnValue([BrandMemberRole.OWNER]);
    const { context } = createMockContext({
      userId: 'user-viewer',
      role: UserRole.BRAND,
    });
    brandsService.resolveActingBrand.mockResolvedValue({
      brand: { id: 'brand-1' },
      memberRole: BrandMemberRole.VIEWER,
    });

    try {
      await guard.canActivate(context);
      fail('Expected DomainErrorException to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(DomainErrorException);
      expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(err.getResponse()).toEqual({
        code: 'brand_role_forbidden',
        message: 'Your team role does not allow this action',
        details: undefined,
      });
    }
  });

  it('an approver on an owner, approver route passes', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      BrandMemberRole.OWNER,
      BrandMemberRole.APPROVER,
    ]);
    const { context } = createMockContext({
      userId: 'user-approver',
      role: UserRole.BRAND,
    });
    brandsService.resolveActingBrand.mockResolvedValue({
      brand: { id: 'brand-1' },
      memberRole: BrandMemberRole.APPROVER,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('a creator token passes through untouched', async () => {
    reflector.getAllAndOverride.mockReturnValue([BrandMemberRole.OWNER]);
    const { context } = createMockContext({
      userId: 'creator-1',
      role: UserRole.CREATOR,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(brandsService.resolveActingBrand).not.toHaveBeenCalled();
  });
});
