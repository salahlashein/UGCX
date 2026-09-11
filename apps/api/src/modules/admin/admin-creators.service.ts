import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Creator, VettingStatus } from '../creators/entities/creator.entity';
import { ProposalsService } from '../proposals/proposals.service';
import { VetCreatorDto } from './dto/vet-creator.dto';

@Injectable()
export class AdminCreatorsService {
  private readonly logger = new Logger(AdminCreatorsService.name);

  constructor(
    @InjectRepository(Creator)
    private readonly creatorsRepository: Repository<Creator>,
    private readonly dataSource: DataSource,
    private readonly proposalsService: ProposalsService,
  ) {}

  async list(
    vettingStatus: VettingStatus | undefined,
    page: number,
    perPage: number,
  ): Promise<[Creator[], number]> {
    const where: FindOptionsWhere<Creator> = {};
    if (vettingStatus !== undefined) {
      where.vettingStatus = vettingStatus;
    }

    return this.creatorsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  /**
   * REQ-010: records the reviewing admin and a timestamp. EDGE-P1-005: a
   * rejection auto-declines the creator's still-open proposals in the same
   * transaction as the vetting decision.
   */
  async vet(
    adminUserId: string,
    creatorId: string,
    dto: VetCreatorDto,
  ): Promise<Creator> {
    return this.dataSource.transaction(async (manager) => {
      const creatorRepo = manager.getRepository(Creator);
      const creator = await creatorRepo.findOne({ where: { id: creatorId } });
      if (!creator) {
        throw new NotFoundException('Creator not found');
      }

      creator.vettingStatus = dto.status;
      creator.reviewedByUserId = adminUserId;
      creator.reviewedAt = new Date();
      const saved = await creatorRepo.save(creator);

      if (dto.status === VettingStatus.REJECTED) {
        await this.proposalsService.declineAllOpenForCreator(
          creator.id,
          manager,
        );
      }

      this.logger.log(
        `Creator ${creator.id} vetting set to ${dto.status} by admin ${adminUserId}`,
      );
      return saved;
    });
  }
}
