import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  mixin,
} from '@nestjs/common';
import { FileInterceptor, MulterModuleOptions } from '@nestjs/platform-express';
import { Observable } from 'rxjs';

export function OptionalFileInterceptor(
  fieldName: string,
  options?: MulterModuleOptions,
): Type<NestInterceptor> {
  const multerInterceptor = FileInterceptor(fieldName, options);

  @Injectable()
  class OptionalFileInterceptorMixin implements NestInterceptor {
    private readonly interceptor: NestInterceptor;

    constructor() {
      this.interceptor = new (multerInterceptor as any)();
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      const contentType = request.headers['content-type'] ?? '';

      if (contentType.includes('multipart/form-data')) {
        return this.interceptor.intercept(context, next) as Promise<Observable<any>>;
      }

      return next.handle();
    }
  }

  return mixin(OptionalFileInterceptorMixin);
}
