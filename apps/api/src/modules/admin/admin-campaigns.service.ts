import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Campaign,
  CampaignStatus,
} from '../campaigns/entities/campaign.entity';
import { EscrowService } from '../escrow/escrow.service';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { VerifyEscrowDto } from './dto/verify-escrow.dto';

/** CampaignsService.submitManualPayment stores `manual:<method>:<ref>`. */
export const MANUAL_PAYMENT_PREFIX = 'manual:';

@Injectable()
export class AdminCampaignsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    private readonly escrowService: EscrowService,
  ) {}

  async listPendingEscrow(
    page = 1,
    perPage = 20,
  ): Promise<{ items: Campaign[]; total: number }> {
    // Only manual submissions wait for an admin. A pending Paymob checkout
    // also sets fundingRequestedAmount, but its webhook settles it, and
    // verifyEscrow rejects it.
    const [items, total] = await this.campaignsRepository
      .createQueryBuilder('campaign')
      // The admin matches the transfer to the brand that sent it.
      .leftJoin('campaign.brand', 'brand')
      .addSelect(['brand.id', 'brand.companyName'])
      .where('campaign.fundingPaymobOrderId LIKE :prefix', {
        prefix: MANUAL_PAYMENT_PREFIX + '%',
      })
      .andWhere('campaign.fundingRequestedAmount IS NOT NULL')
      .orderBy('campaign.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { items, total };
  }

  async verifyEscrow(
    _adminUserId: string,
    campaignId: string,
    dto: VerifyEscrowDto,
  ): Promise<{
    campaignId: string;
    status: CampaignStatus;
    fundedAmount: string;
    message: string;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const campaignRepo = manager.getRepository(Campaign);
      const campaign = await campaignRepo.findOne({
        where: { id: campaignId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Fund only a manual payment that the brand submitted and that no
      // admin has verified yet. Without this check, a verify on a brief
      // with no submission, or a second verify, funds escrow with money
      // that nobody paid.
      const pendingManual =
        !!campaign.fundingRequestedAmount &&
        !!campaign.fundingPaymobOrderId?.startsWith(MANUAL_PAYMENT_PREFIX);
      if (!pendingManual) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'no_pending_manual_payment',
          'This brief has no manual payment waiting for verification',
        );
      }

      if (!dto.approved) {
        campaign.fundingPaymobOrderId = null;
        campaign.fundingRequestedAmount = null;
        await campaignRepo.save(campaign);
        return {
          campaignId: campaign.id,
          status: campaign.status,
          fundedAmount: campaign.escrowFundedAmount,
          message: 'Manual escrow payment rejected.',
        };
      }

      const amountToFund = campaign.fundingRequestedAmount as string;
      const reference =
        dto.reference || (campaign.fundingPaymobOrderId as string);

      await this.escrowService.applyFunding(
        campaign.id,
        amountToFund,
        campaign.currency,
        reference,
        manager,
        'manual_instapay_vodafone',
      );

      const updatedCampaign = await campaignRepo.findOneOrFail({
        where: { id: campaign.id },
      });
      updatedCampaign.fundingPaymobOrderId = null;
      updatedCampaign.fundingRequestedAmount = null;
      if (updatedCampaign.status === CampaignStatus.DRAFT) {
        updatedCampaign.status = CampaignStatus.LIVE;
        updatedCampaign.publishedAt = new Date();
      }
      await campaignRepo.save(updatedCampaign);

      return {
        campaignId: updatedCampaign.id,
        status: updatedCampaign.status,
        fundedAmount: updatedCampaign.escrowFundedAmount,
        message: 'Escrow payment verified and campaign published live.',
      };
    });
  }
}
