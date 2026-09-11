import { IsIn } from 'class-validator';
import { ProposalStatus } from '../entities/proposal.entity';

export class UpdateProposalStatusDto {
  // REQ-009: a brand can only shortlist or decline; 'accepted' is
  // deliberately not exposed here (DES-P1-001, escrow/payments plan owns it).
  @IsIn([ProposalStatus.SHORTLISTED, ProposalStatus.DECLINED])
  status: ProposalStatus.SHORTLISTED | ProposalStatus.DECLINED;
}
