import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../config/app-config';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { ipKey, nextAttemptState, userKey } from './login-attempt.policy';

/**
 * Login failure throttling shared through `sys_login_attempt`:
 * 5 failures per user, 20 per IP, 15-minute window and lock.
 */
@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly repository: Repository<LoginAttempt>,
    private readonly config: AppConfig,
  ) {}

  async isBlocked(ip: string | null, username: string | null): Promise<boolean> {
    const keys = [ipKey(ip), userKey(username)];
    const locked = await this.repository
      .createQueryBuilder('attempt')
      .where('attempt.attemptKey IN (:...keys)', { keys })
      .andWhere('attempt.lockedUntil > :now', { now: new Date() })
      .getCount();
    return locked > 0;
  }

  async onFailure(ip: string | null, username: string | null): Promise<void> {
    await this.record(ipKey(ip), this.config.login.ipMaxAttempts);
    await this.record(userKey(username), this.config.login.userMaxAttempts);
  }

  /** Only the account counter is cleared so a success cannot reset the IP one. */
  async onSuccess(_ip: string | null, username: string | null): Promise<void> {
    await this.clearUserAttempts(username);
  }

  async clearUserAttempts(username: string | null): Promise<void> {
    await this.repository.delete({ attemptKey: userKey(username) });
  }

  private async record(key: string, maxAttempts: number): Promise<void> {
    const now = new Date();
    await this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(LoginAttempt);
      const existing = await repository.findOne({
        where: { attemptKey: key },
        lock: { mode: 'pessimistic_write' },
      });
      const state = nextAttemptState(existing, now, maxAttempts, this.config.login.lockMinutes);

      if (existing) {
        repository.merge(existing, state);
        await repository.save(existing);
        return;
      }

      try {
        await repository.insert({ attemptKey: key, ...state });
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
        const current = await repository.findOne({
          where: { attemptKey: key },
          lock: { mode: 'pessimistic_write' },
        });
        if (current) {
          repository.merge(
            current,
            nextAttemptState(current, now, maxAttempts, this.config.login.lockMinutes),
          );
          await repository.save(current);
        }
      }
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { driverError?: { code?: string } }).driverError?.code === '23505'
  );
}
