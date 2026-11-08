import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync } from 'node:crypto';
import type { AppConfig } from '../config/app-config';
import { TokenService } from './token.service';

function appConfig(algorithm: 'RS256' | 'HS256'): AppConfig {
  return {
    jwt: {
      algorithm,
      secret: 'a-32-byte-development-secret-key!!',
      accessExpire: 900,
      refreshExpire: 604800,
      issuer: 'orange',
    },
  } as AppConfig;
}

function algorithmOf(token: string): string {
  const header = token.split('.')[0];
  return JSON.parse(Buffer.from(header, 'base64url').toString('utf8')).alg;
}

describe('TokenService algorithms', () => {
  it('signs with HS256 when no RSA pair is configured', async () => {
    const service = new TokenService(
      new JwtService({ secret: 'a-32-byte-development-secret-key!!' }),
      appConfig('HS256'),
    );

    const token = await service.signAccess({ id: 'user-id', username: 'alice', tokenVersion: 3 });

    expect(algorithmOf(token)).toBe('HS256');
    const claims = await service.parseAccess(token);
    expect(claims.sub).toBe('user-id');
    expect(claims.username).toBe('alice');
    expect(claims.ver).toBe(3);
  });

  it('signs with RS256 when both keys are configured', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const service = new TokenService(
      new JwtService({ privateKey, publicKey }),
      appConfig('RS256'),
    );

    const token = await service.signAccess({ id: 'user-id', username: 'alice', tokenVersion: 3 });

    expect(algorithmOf(token)).toBe('RS256');
    const claims = await service.parseAccess(token);
    expect(claims.sub).toBe('user-id');
    expect(claims.username).toBe('alice');
    expect(claims.ver).toBe(3);
  });
});
