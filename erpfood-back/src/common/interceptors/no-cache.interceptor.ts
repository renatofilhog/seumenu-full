import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class NoCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request & { headers?: Record<string, string | string[] | undefined> }>();
    const response = context.switchToHttp().getResponse();
    const acceptHeader = request?.headers?.accept;
    const acceptValue = Array.isArray(acceptHeader) ? acceptHeader.join(',') : acceptHeader ?? '';

    if (acceptValue.includes('text/event-stream')) {
      return next.handle();
    }

    response.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    response.setHeader('Surrogate-Control', 'no-store');

    return next.handle();
  }
}
