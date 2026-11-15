import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListBriefQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['all', 'draft', 'open', 'completed'], {
    message: 'status must be all, draft, open, or completed',
  })
  status?: 'all' | 'draft' | 'open' | 'completed' = 'all';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;
}
