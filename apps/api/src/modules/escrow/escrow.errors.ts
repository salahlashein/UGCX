import { HttpStatus } from '@nestjs/common';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { centsToAmount } from '../../common/utils/money';

export interface EscrowShortfall {
  requiredCents: number;
  availableCents: number;
  shortfallCents: number;
}

export class InsufficientEscrowError extends DomainErrorException {
  constructor(
    public readonly shortfall: EscrowShortfall,
    campaignId?: string,
  ) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'insufficient_escrow',
      'This brief does not hold enough escrow for that price',
      [
        {
          field: 'shortfall',
          message: centsToAmount(shortfall.shortfallCents),
        },
        // The app needs the brief id to start a top-up for exactly the shortfall.
        ...(campaignId ? [{ field: 'campaignId', message: campaignId }] : []),
      ],
    );
  }
}
