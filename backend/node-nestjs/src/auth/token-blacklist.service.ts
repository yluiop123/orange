import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import { RevokedToken } from '../entities/revoked-token.entity';

/**
 * Revoked `jti` records.
 *
 * The insert relies on the primary key to stay atomic, so a replayed refresh
 * token is detected even under concurrency: a duplicate key is a no-op and
 * reported as `false`. This is the portable equivalent of the previous
 * `INSERT ... ON CONFLICT (jti) DO NOTHING RETURNING jti`, which only worked on
 * PostgreSQL.
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

    try {
      await this.dataSource.getRepository(RevokedToken).insert({ jti, tokenType, expiresAt });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  async isRevoked(jti: string | null | undefined): Promise<boolean> {
    if (!jti) {
      return false;
    }
    const count = await this.dataSource.getRepository(RevokedToken).count({ where: { jti } });
    return count > 0;
  }
}
