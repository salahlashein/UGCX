import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

export type ReviewAction = 'approve' | 'request_revision' | 'decline';

/** TASK-P1-008: feedback is required for request_revision and decline. */
export class ReviewDeliverableDto {
  @IsIn(['approve', 'request_revision', 'decline'])
  action: ReviewAction;

  @ValidateIf((dto: ReviewDeliverableDto) => dto.action !== 'approve')
  @IsString()
  @MinLength(1)
  feedback?: string;
}
