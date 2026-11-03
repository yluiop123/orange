import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RevokedToken } from '../entities/revoked-token.entity';

/**
 * Revoked `jti` records. Insert is atomic (`ON CONFLICT DO NOTHING`) so a
 * replayed refresh token can be detected even under concurrency.
 */
@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async revoke(jti: string | null | undefined, tokenType: string, expiresAt: Date | null): Promise<boolean> {
    if (!jti || !expiresAt || Number.isNaN(expiresAt.getTime())) {
      return false;
    }
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(RevokedToken)
      .where('expires_at < :now', { now: new Date() })
      .execute();

    const rows: Array<{ jti: string }> = await this.dataSource.query(
      `INSERT INTO sys_revoked_token (jti, token_type, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (jti) DO NOTHING
       RETURNING jti`,
      [jti, tokenType, expiresAt],
    );
    return rows.length > 0;
  }

  async isRevoked(jti: string | null | undefined): Promise<boolean> {
    if (!jti) {
      return false;
    }
    const count = await this.dataSource.getRepository(RevokedToken).count({ where: { jti } });
    return count > 0;
  }
}
