import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { VettingStatus } from '../../creators/entities/creator.entity';

/**
 * Extends the shared pagination params with the vetting_status filter.
 * Named to match the literal query key from the plan
 * (GET /admin/creators?vetting_status=pending) rather than camelCasing it,
 * since the global ValidationPipe whitelists this whole query object.
 */
export class ListCreatorsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VettingStatus)
  vetting_status?: VettingStatus;
}
