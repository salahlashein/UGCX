import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export type ReviewAction = 'approve' | 'request_revision' | 'decline';

/** TASK-P1-008, TASK-W4-03: feedback is required for request_revision and decline, optional on approve (max 1000). */
export class ReviewDeliverableDto {
  @IsIn(['approve', 'request_revision', 'decline'])
  action: ReviewAction;

  @ValidateIf((dto: ReviewDeliverableDto) => dto.action !== 'approve')
  @IsNotEmpty({ message: 'Feedback is required when declining or requesting revision' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

