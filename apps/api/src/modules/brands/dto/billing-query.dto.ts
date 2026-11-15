import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class BillingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['charge', 'refund', 'hold', 'release'], {
    message: 'type must be one of: charge, refund, hold, release',
  })
  type?: 'charge' | 'refund' | 'hold' | 'release';
}
