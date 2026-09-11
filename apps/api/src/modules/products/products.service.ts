import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly brandsService: BrandsService,
  ) {}

  /** REQ-004: the product is always associated with the caller's own brand. */
  async create(userId: string, dto: CreateProductDto): Promise<Product> {
    const brand = await this.brandsService.findByUserId(userId);
    const product = this.productsRepository.create({
      brandId: brand.id,
      name: dto.name,
      description: dto.description ?? null,
      valueProps: dto.valueProps ?? [],
      images: dto.images ?? [],
    });
    return this.productsRepository.save(product);
  }

  async list(
    userId: string,
    page: number,
    perPage: number,
  ): Promise<[Product[], number]> {
    const brand = await this.brandsService.findByUserId(userId);
    return this.productsRepository.findAndCount({
      where: { brandId: brand.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  async findOwned(userId: string, id: string): Promise<Product> {
    const brand = await this.brandsService.findByUserId(userId);
    return this.findByIdAndBrandId(id, brand.id);
  }

  /** Used by CampaignsService to check a product belongs to the same brand. */
  async findByIdAndBrandId(id: string, brandId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, brandId },
    });
    if (!product) {
      // EDGE-P1-002 pattern: not-mine reads as not-found, never 403.
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOwned(userId, id);
    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  async remove(userId: string, id: string): Promise<void> {
    const product = await this.findOwned(userId, id);
    await this.productsRepository.remove(product);
  }
}
