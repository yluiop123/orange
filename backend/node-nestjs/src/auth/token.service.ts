import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../config/app-config';

export interface TokenClaims {
  jti: string;
  typ: 'access' | 'refresh';
  ver: number;
  username: string;
  sub: string;
  iat: number;
  exp: number;
}

export interface TokenSubject {
  id: string;
  username: string;
  tokenVersion?: number | null;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  signAccess(user: TokenSubject): Promise<string> {
    return this.sign(user, 'access', this.config.jwt.accessExpire);
  }

  signRefresh(user: TokenSubject): Promise<string> {
    return this.sign(user, 'refresh', this.config.jwt.refreshExpire);
  }

  verify(token: string): Promise<TokenClaims> {
    return this.jwt.verifyAsync<TokenClaims>(token, {
      issuer: this.config.jwt.issuer,
      algorithms: [this.config.jwt.algorithm],
    });
  }

  async parseAccess(token: string): Promise<TokenClaims> {
    const claims = await this.verify(token);
    if (claims.typ !== 'access') {
      throw new Error('not an access token');
    }
    return claims;
  }

  async parseRefresh(token: string): Promise<TokenClaims> {
    const claims = await this.verify(token);
    if (claims.typ !== 'refresh') {
      throw new Error('not a refresh token');
    }
    return claims;
  }

  get accessExpireSeconds(): number {
    return this.config.jwt.accessExpire;
  }

  get refreshExpireSeconds(): number {
    return this.config.jwt.refreshExpire;
  }

  private sign(user: TokenSubject, typ: 'access' | 'refresh', expiresIn: number): Promise<string> {
    return this.jwt.signAsync(
      {
        jti: randomUUID(),
        typ,
        ver: user.tokenVersion ?? 0,
        username: user.username,
        sub: user.id,
      },
      {
        expiresIn,
        issuer: this.config.jwt.issuer,
        algorithm: this.config.jwt.algorithm,
      },
    );
  }
}
