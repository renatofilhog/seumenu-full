import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';

type AuthRequest = Request & {
  user?: JwtPayload;
};

@Injectable()
export class SaasManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    if (!user) {
      return false;
    }

    if (user.principalType !== 'saas_management_user') {
      throw new ForbiddenException('Acesso permitido apenas para gerenciamento SAAS');
    }

    return true;
  }
}
