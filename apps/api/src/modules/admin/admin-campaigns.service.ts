import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Campaign,
  CampaignStatus,
} from '../campaigns/entities/campaign.entity';
import { EscrowService } from '../escrow/escrow.service';
import { VerifyEscrowDto } from './dto/verify-escrow.dto';

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
    const [items, total] = await this.campaignsRepository
      .createQueryBuilder('campaign')
      .where('campaign.fundingPaymobOrderId LIKE :prefix', {
        prefix: 'manual:%',
      })
      .orWhere('campaign.fundingRequestedAmount IS NOT NULL')
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

      const amountToFund =
        campaign.fundingRequestedAmount || campaign.budgetMin || '1000.00';
      const reference =
        dto.reference ||
        campaign.fundingPaymobOrderId ||
        `manual-admin-${Date.now()}`;

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
