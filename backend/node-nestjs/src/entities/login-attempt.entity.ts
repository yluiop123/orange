import { Column, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { timestampType } from './column-types';

@Entity('sys_login_attempt')
export class LoginAttempt {
  @PrimaryColumn({ name: 'attempt_key', type: 'varchar' })
  attemptKey: string;

  @Column({ type: 'int', default: 0 })
  failures: number;

  @Column({ name: 'window_start', type: timestampType() })
  windowStart: Date;

  @Index()
  @Column({ name: 'locked_until', type: timestampType(), nullable: true })
  lockedUntil: Date | null;

  @UpdateDateColumn({ name: 'update_time', type: timestampType() })
  updateTime: Date;
}
