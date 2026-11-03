import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';
import { BusinessException } from '../common/business-exception';
import { STATUS_DISABLE } from '../common/constants';
import { BusinessCode } from '../common/error-code';
import { toIso } from '../common/page';
import { hashPassword, verifyPassword } from '../common/password.util';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { computeEffectivePermissions } from '../policies/effective-permissions';
import type { AuthUser } from './auth-user';
import { LoginAttemptService } from './login-attempt.service';
import { RefreshTokenCookie } from './refresh-token.cookie';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenService } from './token.service';
import { UserLookupService } from './user-lookup.service';

export interface LoginResponse {
  token: string;
  status: 'ok';
  field: null;
  msg: null;
  expiresIn: number;
  refreshExpiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Group)
    private readonly groups: Repository<Group>,
    private readonly userLookup: UserLookupService,
    private readonly tokens: TokenService,
    private readonly cookie: RefreshTokenCookie,
    private readonly loginAttempts: LoginAttemptService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async login(
    username: string,
    password: string,
    ip: string | null,
    response: Response,
  ): Promise<LoginResponse> {
    if (await this.loginAttempts.isBlocked(ip, username)) {
      this.cookie.clear(response);
      throw new BusinessException(
        '登录失败次数过多，请稍后再试',
        BusinessCode.RATE_LIMITED,
      );
    }

    const user = await this.userLookup.findByUsername(username);
    const passwordMatches = user ? await verifyPassword(password, user.password) : false;
    if (!user || user.status === STATUS_DISABLE || !passwordMatches) {
      await this.loginAttempts.onFailure(ip, username);
      this.cookie.clear(response);
      // Same message for unknown user and wrong password: no user enumeration.
      throw BusinessException.unauthorized('用户名或密码错误');
    }

    await this.loginAttempts.onSuccess(ip, username);
    const token = await this.tokens.signAccess(user);
    const refreshToken = await this.tokens.signRefresh(user);
    this.cookie.set(response, refreshToken);
    return this.loginResponse(token);
  }

  async refresh(refreshToken: string | null, response: Response): Promise<LoginResponse> {
    if (!refreshToken || refreshToken.trim().length === 0) {
      this.cookie.clear(response);
      throw BusinessException.unauthorized();
    }

    try {
      const claims = await this.tokens.parseRefresh(refreshToken);
      if (await this.blacklist.isRevoked(claims.jti)) {
        throw new Error('revoked');
      }

      const user = await this.users.findOneBy({ id: claims.sub });
      if (
        !user ||
        user.status === STATUS_DISABLE ||
        (user.tokenVersion ?? 0) !== Number(claims.ver) ||
        user.username !== claims.username
      ) {
        throw new Error('stale token');
      }

      // Rotation: replaying the old jti must fail even under concurrency.
      const revoked = await this.blacklist.revoke(
        claims.jti,
        'refresh',
        new Date(claims.exp * 1000),
      );
      if (!revoked) {
        throw new Error('rotation race');
      }

      const token = await this.tokens.signAccess(user);
      const rotated = await this.tokens.signRefresh(user);
      this.cookie.set(response, rotated);
      return this.loginResponse(token);
    } catch {
      this.cookie.clear(response);
      throw BusinessException.unauthorized('登录已过期');
    }
  }

  async logout(
    principal: AuthUser | undefined,
    refreshToken: string | null,
    response: Response,
  ): Promise<void> {
    let username = principal?.username ?? null;

    if (refreshToken) {
      try {
        const claims = await this.tokens.parseRefresh(refreshToken);
        username = username ?? claims.username;
        await this.blacklist.revoke(claims.jti, 'refresh', new Date(claims.exp * 1000));
      } catch {
        // A stale/invalid cookie must not block logout.
      }
    }

    if (principal?.tokenId && principal.tokenExpiresAt) {
      await this.blacklist.revoke(principal.tokenId, 'access', principal.tokenExpiresAt);
    }

    if (username) {
      const user = await this.users.findOneBy({ username });
      if (user) {
        // Same as the reference: logout invalidates every outstanding token.
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
        await this.users.save(user);
      }
    }

    this.cookie.clear(response);
  }

  async userInfo(principal: AuthUser) {
    const user = await this.userLookup.findById(principal.id);
    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }
    const effective = computeEffectivePermissions(user);
    const group = user.groupId ? await this.groups.findOneBy({ id: user.groupId }) : null;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      groupId: user.groupId,
      groupName: group?.name ?? '',
      phone: user.phone,
      status: user.status,
      mustChangePassword: !!user.mustChangePassword,
      createTime: toIso(user.createTime),
      updateTime: toIso(user.updateTime),
      roles: effective.roles.map((role) => ({ id: role.id, name: role.name ?? null })),
      rolePermissions: effective.rolePermissions.map((item) => ({
        role: item.roleId,
        type: item.permission.type,
        path: item.permission.path,
        action: item.permission.action ?? null,
      })),
      userPermissions: effective.directPermissions.map((permission) => ({
        type: permission.type,
        path: permission.path,
        action: permission.action ?? null,
      })),
    };
  }

  async changePassword(
    principal: AuthUser,
    oldPassword: string,
    newPassword: string,
    response: Response,
  ): Promise<string> {
    const user = await this.users.findOneBy({ username: principal.username });
    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }
    if (!(await verifyPassword(oldPassword, user.password))) {
      throw BusinessException.validate('原密码错误');
    }
    if (await verifyPassword(newPassword, user.password)) {
      throw BusinessException.validate('新密码不能与原密码相同');
    }

    user.password = await hashPassword(newPassword);
    user.mustChangePassword = false;
    // Invalidate every old access/refresh token.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.users.save(user);
    await this.loginAttempts.clearUserAttempts(user.username);
    this.cookie.clear(response);
    return '密码已修改，请重新登录';
  }

  private loginResponse(token: string): LoginResponse {
    return {
      token,
      status: 'ok',
      field: null,
      msg: null,
      expiresIn: this.tokens.accessExpireSeconds,
      refreshExpiresIn: this.tokens.refreshExpireSeconds,
    };
  }
}
