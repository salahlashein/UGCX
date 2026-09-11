import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { BrandsService } from '../brands/brands.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let brandsService: { findByUserId: jest.Mock };

  beforeEach(async () => {
    productsRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    brandsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'brand-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        { provide: BrandsService, useValue: brandsService },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('associates a created product with the caller brand, never client input (REQ-004)', async () => {
    const product = await service.create('user-1', { name: 'Serum' });
    expect(product.brandId).toBe('brand-1');
  });

  it('returns 404, not 403, when reading another brand product (EDGE-P1-002)', async () => {
    productsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOwned('user-1', 'someone-elses-product'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
