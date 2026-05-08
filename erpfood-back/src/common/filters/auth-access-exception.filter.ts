import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UnauthorizedException, ForbiddenException)
export class AuthAccessExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      if (!response.writableEnded) {
        response.end();
      }
      return;
    }

    const status = exception.getStatus();
    const body = exception.getResponse();
    const message = this.resolveMessage(body);

    const requestId = (request as Request & { requestId?: string }).requestId
      ?? (Array.isArray(request.headers['x-request-id']) ? request.headers['x-request-id'][0] : request.headers['x-request-id']);

    response.status(status).json({
      statusCode: status,
      error: status === HttpStatus.UNAUTHORIZED ? 'Unauthorized' : 'Forbidden',
      code: status === HttpStatus.UNAUTHORIZED ? 'ACCESS_UNAUTHORIZED' : 'ACCESS_FORBIDDEN',
      message,
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveMessage(responseBody: string | object): string {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (responseBody && typeof responseBody === 'object' && 'message' in responseBody) {
      const message = (responseBody as { message: string | string[] }).message;
      return Array.isArray(message) ? message.join(', ') : message;
    }

    return 'Acesso negado';
  }
}
