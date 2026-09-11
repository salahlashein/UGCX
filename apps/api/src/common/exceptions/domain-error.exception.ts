import { HttpException, HttpStatus } from '@nestjs/common';

export interface DomainErrorDetail {
  field: string;
  message: string;
}

/**
 * Carries a stable, domain-specific error code (e.g. "duplicate_proposal")
 * through AllExceptionsFilter instead of the generic HTTP status name, per
 * the error envelope in the api-patterns skill and this plan's Schemas.
 */
export class DomainErrorException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: DomainErrorDetail[],
  ) {
    super({ code, message, details }, status);
  }
}
