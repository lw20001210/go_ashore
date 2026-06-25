import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorLogService } from './error-log.service';
import type { RequestWithId } from './request.types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly errorLog: ErrorLogService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.requestId ?? 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let detail = 'Internal Server Error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        detail = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        const message = (payload as { message?: string | string[] }).message;
        if (Array.isArray(message)) {
          detail = message.join('；');
        } else if (typeof message === 'string') {
          detail = message;
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      stack = exception.stack;
    }

    const isServerError = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
    const publicMessage = isServerError ? 'Internal Server Error' : detail;

    if (statusCode >= HttpStatus.BAD_REQUEST) {
      this.errorLog.record({
        requestId,
        statusCode,
        message: publicMessage,
        detail,
        stack,
        path: request.url,
        method: request.method,
        createdAt: new Date().toISOString(),
      });
    }

    response.status(statusCode).json({
      statusCode,
      message: publicMessage,
      requestId,
    });
  }
}
