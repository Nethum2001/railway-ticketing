import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawResponse = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const message =
      typeof rawResponse === 'string'
        ? rawResponse
        : Array.isArray((rawResponse as { message?: unknown }).message)
          ? ((rawResponse as { message: string[] }).message ?? []).join(', ')
          : (rawResponse as { message?: string }).message ?? 'Request failed';

    this.logger.error(`${request.method} ${request.url} -> ${status}: ${message}`);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: exception instanceof Error ? exception.name : 'Error',
    });
  }
}