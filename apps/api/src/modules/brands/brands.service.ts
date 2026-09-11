import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
  ) {}

  /**
   * Ownership is always derived from the authenticated user, never from a
   * request param (REQ-004). Also used by other modules to resolve the
   * caller's brandId.
   */
  async findByUserId(userId: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { userId } });
    if (!brand) {
      throw new NotFoundException('Brand profile not found');
    }
    return brand;
  }

  async updateByUserId(userId: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findByUserId(userId);
    Object.assign(brand, dto);
    return this.brandsRepository.save(brand);
  }
}
