import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { BusinessException } from '../common/business-exception';
import { PageData, buildPageData, toIso } from '../common/page';
import { likeContains } from '../common/query.util';
import { AppConfig } from '../config/app-config';
import { OperationLog } from '../entities/operation-log.entity';
import { QueryOperationLogDto } from './operation-log.dto';

export interface OperationLogEntry {
  traceId: string | null;
  username: string | null;
  method: string;
  path: string;
  queryString: string | null;
  requestBody: string | null;
  status: number;
  durationMs: number;
  ip: string | null;
}

export interface OperationLogBean extends OperationLogEntry {
  id: number;
  createTime: string | null;
}

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OperationLogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('OperationLog');
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(OperationLog)
    private readonly logs: Repository<OperationLog>,
    private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    void this.cleanup();
    this.timer = setInterval(() => void this.cleanup(), CLEANUP_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async record(entry: OperationLogEntry): Promise<void> {
    await this.logs.insert({
      traceId: entry.traceId,
      username: entry.username,
      method: entry.method,
      path: entry.path,
      queryString: entry.queryString,
      requestBody: entry.requestBody,
      status: entry.status,
      durationMs: String(entry.durationMs),
      ip: entry.ip,
    });
  }

  async query(query: QueryOperationLogDto): Promise<PageData<OperationLogBean>> {
    const page = query.page ?? 1;
    const size = query.size ?? 10;

    const builder = this.logs.createQueryBuilder('log');
    if (isNotBlank(query.username)) {
      builder.andWhere('LOWER(log.username) LIKE :username', {
        username: likeContains(query.username),
      });
    }
    if (isNotBlank(query.path)) {
      builder.andWhere('LOWER(log.path) LIKE :path', { path: likeContains(query.path) });
    }
    if (isNotBlank(query.status)) {
      const status = Number.parseInt(query.status as string, 10);
      builder.andWhere('log.status = :status', { status });
    }
    if (isNotBlank(query.from)) {
      builder.andWhere('log.createTime >= :from', { from: parseDate(query.from, 'from') });
    }
    if (isNotBlank(query.to)) {
      builder.andWhere('log.createTime <= :to', { to: parseDate(query.to, 'to') });
    }

    const total = await builder.getCount();
    const rows = await builder
      .orderBy('log.id', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .getMany();

    return buildPageData(
      total,
      rows.map((row) => ({
        id: Number(row.id),
        traceId: row.traceId,
        username: row.username,
        method: row.method,
        path: row.path,
        queryString: row.queryString,
        requestBody: row.requestBody,
        status: row.status,
        durationMs: Number(row.durationMs),
        ip: row.ip,
        createTime: toIso(row.createTime),
      })),
      page,
      size,
    );
  }

  /** Retention cleanup; the Java backend runs it on a cron. */
  private async cleanup(): Promise<void> {
    try {
      const cutoff = new Date(
        Date.now() - this.config.operationLog.retentionDays * 24 * 60 * 60 * 1000,
      );
      await this.logs.delete({ createTime: LessThan(cutoff) });
    } catch (error) {
      this.logger.warn(`operation log cleanup failed: ${(error as Error).message}`);
    }
  }
}

function parseDate(value: string | undefined, field: string): Date {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    throw BusinessException.param(`参数 ${field} 不是有效的时间`);
  }
  return date;
}

function isNotBlank(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
