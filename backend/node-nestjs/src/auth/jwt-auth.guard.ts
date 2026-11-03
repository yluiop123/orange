import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRequest } from '../common/app-request';
import { ALLOWED_BEFORE_PASSWORD_CHANGE } from '../common/constants';
import { BusinessException } from '../common/business-exception';
import { AUTHORITIES_KEY, IS_PUBLIC_KEY } from './decorators';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenService } from './token.service';
import { UserLookupService } from './user-lookup.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly users: UserLookupService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const token = resolveBearer(request);

    if (!token) {
      if (isPublic) {
        return true;
      }
      throw BusinessException.unauthorized();
    }

    try {
      const claims = await this.tokens.parseAccess(token);
      if (await this.blacklist.isRevoked(claims.jti)) {
        throw BusinessException.unauthorized();
      }

      const user = await this.users.loadAuthUser(claims.username);
      if (!user || user.tokenVersion !== Number(claims.ver) || claims.sub !== user.id) {
        throw BusinessException.unauthorized();
      }

      if (user.mustChangePassword && !isAllowedBeforePasswordChange(request.path)) {
        throw BusinessException.passwordChangeRequired();
      }

      user.tokenId = claims.jti;
      user.tokenExpiresAt = new Date(claims.exp * 1000);
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (isPublic) {
        return true;
      }
      throw BusinessException.unauthorized();
    }
  }
}

function resolveBearer(request: AppRequest): string | null {
  const header = request.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function isAllowedBeforePasswordChange(path: string): boolean {
  return ALLOWED_BEFORE_PASSWORD_CHANGE.includes(path);
}
