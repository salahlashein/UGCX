import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { BrandsService } from '../brands/brands.service';
import { ProductsService } from '../products/products.service';
import { UserRole } from '../users/entities/user.entity';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
  ) {}

  /** REQ-005: draft status, requires a product owned by the same brand. */
  async create(userId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const brand = await this.brandsService.findByUserId(userId);
    const product = await this.productsService.findByIdAndBrandId(
      dto.productId,
      brand.id,
    );
    const campaign = this.campaignsRepository.create({
      brandId: brand.id,
      productId: product.id,
      status: CampaignStatus.DRAFT,
    });
    return this.campaignsRepository.save(campaign);
  }

  async listMine(
    userId: string,
    page: number,
    perPage: number,
  ): Promise<[Campaign[], number]> {
    const brand = await this.brandsService.findByUserId(userId);
    return this.campaignsRepository.findAndCount({
      where: { brandId: brand.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  /** REQ-007: only live campaigns, optionally filtered by niche/country/language. */
  async listLive(query: QueryCampaignDto): Promise<[Campaign[], number]> {
    const qb = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.brand', 'brand')
      .where('campaign.status = :status', { status: CampaignStatus.LIVE });

    if (query.niche) {
      qb.andWhere('campaign.niche = :niche', { niche: query.niche });
    }
    if (query.language) {
      qb.andWhere('campaign.language = :language', {
        language: query.language,
      });
    }
    if (query.country) {
      qb.andWhere('brand.country = :country', { country: query.country });
    }

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((query.page - 1) * query.perPage)
      .take(query.perPage);

    return qb.getManyAndCount();
  }

  /**
   * A brand sees its own campaign at any status; a creator (or admin) only
   * sees it once live. Cross-tenant or not-yet-live reads are 404, never
   * 403 (EDGE-P1-002).
   */
  async findOne(user: AuthUser, id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (user.role === UserRole.BRAND) {
      const brand = await this.brandsService.findByUserId(user.userId);
      if (campaign.brandId !== brand.id) {
        throw new NotFoundException('Campaign not found');
      }
      return campaign;
    }

    if (campaign.status !== CampaignStatus.LIVE) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  async findOwned(userId: string, id: string): Promise<Campaign> {
    const brand = await this.brandsService.findByUserId(userId);
    const campaign = await this.campaignsRepository.findOne({
      where: { id, brandId: brand.id },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  /** Existence lookup by id only, used by ProposalsService's own status check. */
  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOwned(userId, id);
    Object.assign(campaign, dto);
    return this.campaignsRepository.save(campaign);
  }

  /** REQ-006: rejects the draft-to-live transition unless all required fields are set. */
  async publish(userId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOwned(userId, id);
    const missing = campaign.missingPublishFields();
    if (missing.length > 0) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
        'Campaign is missing required fields',
        missing,
      );
    }

    campaign.status = CampaignStatus.LIVE;
    const saved = await this.campaignsRepository.save(campaign);
    this.logger.log(`Campaign ${saved.id} published`);
    return saved;
  }
}
