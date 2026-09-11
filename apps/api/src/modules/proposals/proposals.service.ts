import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreatorsService } from '../creators/creators.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { BrandsService } from '../brands/brands.service';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    private readonly creatorsService: CreatorsService,
    private readonly campaignsService: CampaignsService,
    private readonly brandsService: BrandsService,
  ) {}

  /** REQ-008/EDGE-P1-003: campaign must be live; one proposal per creator. */
  async create(
    userId: string,
    campaignId: string,
    dto: CreateProposalDto,
  ): Promise<Proposal> {
    const creator = await this.creatorsService.findByUserId(userId);
    const campaign = await this.campaignsService.findById(campaignId);

    if (campaign.status !== CampaignStatus.LIVE) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'campaign_not_open',
        'This campaign is not open for proposals',
      );
    }

    const proposal = this.proposalsRepository.create({
      campaignId: campaign.id,
      creatorId: creator.id,
      price: dto.price.toFixed(2),
      deliveryDays: dto.deliveryDays,
      pitch: dto.pitch,
      status: ProposalStatus.APPLIED,
    });

    try {
      const saved = await this.proposalsRepository.save(proposal);
      this.logger.log(
        `Creator ${creator.id} applied to campaign ${campaign.id}`,
      );
      return saved;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'duplicate_proposal',
          'You already applied to this campaign',
        );
      }
      throw error;
    }
  }

  async listForCampaign(
    userId: string,
    campaignId: string,
    page: number,
    perPage: number,
  ): Promise<[Proposal[], number]> {
    // SEC-001: 404s if the campaign is not owned by this brand.
    await this.campaignsService.findOwned(userId, campaignId);
    return this.proposalsRepository.findAndCount({
      where: { campaignId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  async listMine(
    userId: string,
    page: number,
    perPage: number,
  ): Promise<[Proposal[], number]> {
    const creator = await this.creatorsService.findByUserId(userId);
    return this.proposalsRepository.findAndCount({
      where: { creatorId: creator.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  /** REQ-009: shortlist or decline only, ownership via the parent campaign. */
  async updateStatus(
    userId: string,
    proposalId: string,
    status: ProposalStatus.SHORTLISTED | ProposalStatus.DECLINED,
  ): Promise<Proposal> {
    const brand = await this.brandsService.findByUserId(userId);
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: { campaign: true },
    });

    if (!proposal || proposal.campaign.brandId !== brand.id) {
      throw new NotFoundException('Proposal not found');
    }

    proposal.status = status;
    const saved = await this.proposalsRepository.save(proposal);
    this.logger.log(`Proposal ${saved.id} set to ${status}`);
    return saved;
  }

  /**
   * TASK-P1-004: loaded with its campaign relation so
   * CollaborationsService can check brand ownership without a second
   * round trip.
   */
  async findById(proposalId: string): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: { campaign: true },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return proposal;
  }

  /**
   * REQ-002: called from CollaborationsService's webhook-handling
   * transaction once a Paymob webhook funds the collaboration. Never
   * called directly by a brand (see UpdateProposalStatusDto).
   */
  async markAccepted(
    proposalId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .getRepository(Proposal)
      .update(proposalId, { status: ProposalStatus.ACCEPTED });
  }

  /**
   * EDGE-P1-005: called from the same transaction as an admin rejecting a
   * creator's vetting. Declines every still-open proposal from that
   * creator so the brand sees why it disappeared.
   */
  async declineAllOpenForCreator(
    creatorId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(Proposal)
      .set({
        status: ProposalStatus.DECLINED,
        declineReason: 'creator_rejected',
      })
      .where('creator_id = :creatorId', { creatorId })
      .andWhere('status IN (:...statuses)', {
        statuses: [ProposalStatus.APPLIED, ProposalStatus.SHORTLISTED],
      })
      .execute();
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
