import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Catches every unhandled exception and returns the standard api-patterns
 * error envelope: { error: { code, message } }. Never leaks a stack trace
 * to the client; the full error is logged server-side instead.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method: string; url: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const code = this.resolveCode(status, exception);
    const message = this.resolveMessage(exception);
    const details = this.resolveDetails(exception);

    this.logger.error(
      `${request.method} ${request.url} failed with status ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      error:
        details !== undefined ? { code, message, details } : { code, message },
    });
  }

  private resolveCode(status: number, exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      // Services may throw an HttpException with a structured response body
      // (e.g. { code: 'duplicate_proposal', message, details? }) to carry a
      // domain-specific error code instead of the generic status name.
      if (
        typeof response === 'object' &&
        response !== null &&
        'code' in response
      ) {
        const code = (response as { code: unknown }).code;
        if (typeof code === 'string') {
          return code;
        }
      }
      return HttpStatus[status]?.toLowerCase().replace(/_/g, '_') ?? 'error';
    }
    return 'internal_error';
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const msg = (response as { message: unknown }).message;
        return Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      return exception.message;
    }
    return 'An unexpected error occurred';
  }

  private resolveDetails(exception: unknown): unknown {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'details' in response
      ) {
        return (response as { details: unknown }).details;
      }
    }
    return undefined;
  }
}
