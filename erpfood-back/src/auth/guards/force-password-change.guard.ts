import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';

type RequestWithAuth = Request & {
  user?: JwtPayload;
};

@Injectable()
export class ForcePasswordChangeGuard implements CanActivate {
  private readonly allowedPaths = ['/user/me/password', '/tenant/resolve'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    if (!user || user.principalType !== 'app_user' || !user.forcePasswordChange) {
      return true;
    }

    if (this.allowedPaths.some((path) => request.path.startsWith(path))) {
      return true;
    }

    throw new ForbiddenException('Troca de senha obrigatoria antes de continuar');
  }
}
