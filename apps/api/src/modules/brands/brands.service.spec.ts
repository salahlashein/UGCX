import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand, BrandVerificationStatus } from './entities/brand.entity';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from './entities/brand-member.entity';
import { BrandCategory } from '../../common/enums/brand-category.enum';
import { R2StorageClient } from '../storage/r2-storage.client';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

describe('BrandsService', () => {
  let service: BrandsService;
  let brandsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let brandMembersRepository: {
    findOne: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };

  beforeEach(async () => {
    brandsRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    brandMembersRepository = {
      findOne: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getRepositoryToken(Brand),
          useValue: brandsRepository,
        },
        {
          provide: getRepositoryToken(BrandMember),
          useValue: brandMembersRepository,
        },
        {
          provide: R2StorageClient,
          // Logos live in the public assets bucket; business documents in
          // the private one.
          useValue: {
            publicBaseUrl: 'https://r2.ugcx.test',
            assetsBaseUrl: 'https://assets.ugcx.test',
            isAssetUrl: (url: string) =>
              url.startsWith('https://assets.ugcx.test/'),
            isPrivateFileUrl: (url: string) =>
              url.startsWith('https://r2.ugcx.test/'),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  describe('TASK-P1-01: Brand profile columns', () => {
    it('findByUserId throws NotFoundException for an unknown user', async () => {
      brandMembersRepository.findOne.mockResolvedValue(null);
      await expect(service.findByUserId('unknown-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updateByUserId writes logoUrl, category, and businessDocumentUrl', async () => {
      const existingBrand: Partial<Brand> = {
        id: 'brand-1',
        userId: 'user-1',
        companyName: 'Old Name',
        verificationStatus: BrandVerificationStatus.UNVERIFIED,
      };
      brandMembersRepository.findOne.mockResolvedValue({
        brand: existingBrand,
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      });

      const result = await service.updateByUserId('user-1', {
        logoUrl: 'https://assets.ugcx.test/brand_logo/logo.png',
        category: BrandCategory.BEAUTY_PERSONAL_CARE,
        businessDocumentUrl: 'https://r2.ugcx.test/brand_document/reg.pdf',
      } as any);

      expect(result.logoUrl).toBe(
        'https://assets.ugcx.test/brand_logo/logo.png',
      );
      expect(result.category).toBe(BrandCategory.BEAUTY_PERSONAL_CARE);
      expect(result.businessDocumentUrl).toBe(
        'https://r2.ugcx.test/brand_document/reg.pdf',
      );
      expect(brandsRepository.save).toHaveBeenCalled();
    });

    it('updateByUserId never writes verificationStatus from a DTO field', async () => {
      const existingBrand: Partial<Brand> = {
        id: 'brand-1',
        userId: 'user-1',
        verificationStatus: BrandVerificationStatus.UNVERIFIED,
      };
      brandMembersRepository.findOne.mockResolvedValue({
        brand: existingBrand,
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      });

      const result = await service.updateByUserId('user-1', {
        companyName: 'Updated Name',
        verificationStatus: BrandVerificationStatus.VERIFIED,
      } as any);

      expect(result.verificationStatus).toBe(
        BrandVerificationStatus.UNVERIFIED,
      );
      expect(brandsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationStatus: BrandVerificationStatus.UNVERIFIED,
          companyName: 'Updated Name',
        }),
      );
    });

    it('updateByUserId throws invalid_media_origin for untrusted logoUrl origin', async () => {
      const existingBrand: Partial<Brand> = {
        id: 'brand-1',
        userId: 'user-1',
      };
      brandMembersRepository.findOne.mockResolvedValue({
        brand: existingBrand,
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      });

      await expect(
        service.updateByUserId('user-1', {
          logoUrl: 'https://attacker.com/fake-logo.png',
        } as any),
      ).rejects.toThrow(DomainErrorException);
    });
  });

  describe('TASK-P1-03: Brand membership resolution', () => {
    it('resolveActingBrand returns the owner role for a user with an owner row', async () => {
      const brand = { id: 'brand-1', companyName: 'Brand 1' } as Brand;
      brandMembersRepository.findOne.mockResolvedValue({
        brand,
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      });

      const acting = await service.resolveActingBrand('user-owner');
      expect(acting.memberRole).toBe(BrandMemberRole.OWNER);
      expect(acting.brand).toBe(brand);
    });

    it('resolveActingBrand returns the viewer role for a user with a viewer row', async () => {
      const brand = { id: 'brand-1', companyName: 'Brand 1' } as Brand;
      brandMembersRepository.findOne.mockResolvedValue({
        brand,
        role: BrandMemberRole.VIEWER,
        status: BrandMemberStatus.ACTIVE,
      });

      const acting = await service.resolveActingBrand('user-viewer');
      expect(acting.memberRole).toBe(BrandMemberRole.VIEWER);
      expect(acting.brand).toBe(brand);
    });

    it('resolveActingBrand throws NotFoundException for a user with only an invited row', async () => {
      brandMembersRepository.findOne.mockResolvedValue(null);
      await expect(service.resolveActingBrand('user-invited')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('findByUserId returns the same brand object resolveActingBrand returns', async () => {
      const brand = { id: 'brand-1', companyName: 'Brand 1' } as Brand;
      brandMembersRepository.findOne.mockResolvedValue({
        brand,
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      });

      const result = await service.findByUserId('user-owner');
      expect(result).toBe(brand);
    });

    it('getBrandStats returns counts and average approval days', async () => {
      const brand = { id: 'brand-1', companyName: 'Brand 1' } as Brand;
      brandMembersRepository.findOne.mockResolvedValue({
        brand,
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      });
      dataSource.query
        .mockResolvedValueOnce([{ count: 4 }])
        .mockResolvedValueOnce([{ count: 3 }])
        .mockResolvedValueOnce([{ avg_days: '2.34' }]);

      const stats = await service.getBrandStats('user-owner');
      expect(stats).toEqual({
        briefsPosted: 4,
        creatorsHired: 3,
        avgApprovalDays: 2.3,
      });
    });
  });
});
