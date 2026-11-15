import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from './entities/brand-member.entity';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { R2StorageClient } from '../storage/r2-storage.client';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

export interface ActingBrand {
  brand: Brand;
  memberRole: BrandMemberRole;
}

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(BrandMember)
    private readonly brandMembersRepository: Repository<BrandMember>,
    private readonly r2StorageClient: R2StorageClient,
    private readonly dataSource: DataSource,
  ) {}

  /** Resolves the brand a user acts for, plus that user's role inside it. */
  async resolveActingBrand(userId: string): Promise<ActingBrand> {
    let member = await this.brandMembersRepository.findOne({
      where: { userId, status: BrandMemberStatus.ACTIVE },
      relations: { brand: { user: true } },
    });

    if (!member || !member.brand) {
      const brand = await this.brandsRepository.findOne({
        where: { userId },
        relations: { user: true },
      });
      if (brand) {
        member = await this.brandMembersRepository.save(
          this.brandMembersRepository.create({
            brandId: brand.id,
            userId,
            role: BrandMemberRole.OWNER,
            status: BrandMemberStatus.ACTIVE,
            acceptedAt: new Date(),
          }),
        );
        return {
          brand,
          memberRole: BrandMemberRole.OWNER,
        };
      }
      throw new NotFoundException('Brand profile not found');
    }

    return {
      brand: member.brand,
      memberRole: member.role,
    };
  }

  /** Kept for the nine existing call sites. Delegates to resolveActingBrand. */
  async findByUserId(userId: string): Promise<Brand> {
    const acting = await this.resolveActingBrand(userId);
    return acting.brand;
  }

  async getMeWithRole(
    userId: string,
  ): Promise<Brand & { memberRole: BrandMemberRole }> {
    const acting = await this.resolveActingBrand(userId);
    return Object.assign(acting.brand, { memberRole: acting.memberRole });
  }

  async updateByUserId(userId: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findByUserId(userId);

    if (
      dto.logoUrl &&
      !dto.logoUrl.startsWith(this.r2StorageClient.publicBaseUrl)
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_media_origin',
        'Logo URL must originate from ReelPal storage',
      );
    }

    if (
      dto.businessDocumentUrl &&
      !dto.businessDocumentUrl.startsWith(this.r2StorageClient.publicBaseUrl)
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_media_origin',
        'Business document URL must originate from ReelPal storage',
      );
    }

    const updates = { ...dto } as Partial<Brand>;
    delete (updates as Record<string, unknown>).verificationStatus;
    delete (updates as Record<string, unknown>).verifiedAt;
    delete (updates as Record<string, unknown>).id;
    delete (updates as Record<string, unknown>).userId;
    Object.assign(brand, updates);
    return this.brandsRepository.save(brand);
  }

  /** BG-12, TASK-W4-08: Public brand stats */
  async getBrandStats(userId: string): Promise<{
    briefsPosted: number;
    creatorsHired: number;
    avgApprovalDays: number | null;
  }> {
    const brand = await this.findByUserId(userId);

    const briefsRes = await this.dataSource.query(
      `SELECT COUNT(*)::int AS count FROM campaigns
       WHERE brand_id = $1 AND status != 'draft'`,
      [brand.id],
    );
    const briefsPosted = briefsRes[0]?.count ? Number(briefsRes[0].count) : 0;

    const hiredRes = await this.dataSource.query(
      `SELECT COUNT(DISTINCT creator_id)::int AS count FROM collaborations
       WHERE brand_id = $1 AND status NOT IN ('cancelled', 'payment_failed')`,
      [brand.id],
    );
    const creatorsHired = hiredRes[0]?.count ? Number(hiredRes[0].count) : 0;

    const approvalRes = await this.dataSource.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (t.created_at - d.created_at)) / 86400.0) AS avg_days
       FROM collaborations col
       INNER JOIN deliverables d ON d.collaboration_id = col.id AND d.status = 'approved'
       INNER JOIN transactions t ON t.collaboration_id = col.id AND t.type = 'release' AND t.status = 'completed'
       WHERE col.brand_id = $1`,
      [brand.id],
    );

    const rawAvg = approvalRes[0]?.avg_days;
    let avgApprovalDays: number | null = null;
    if (rawAvg != null && !isNaN(Number(rawAvg))) {
      const days = Number(rawAvg);
      avgApprovalDays = Math.round(days * 10) / 10;
    }

    return { briefsPosted, creatorsHired, avgApprovalDays };
  }
}
