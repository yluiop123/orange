import { Column, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_login_attempt')
export class LoginAttempt {
  @PrimaryColumn({ name: 'attempt_key', type: 'varchar' })
  attemptKey: string;

  @Column({ type: 'int', default: 0 })
  failures: number;

  @Column({ name: 'window_start', type: 'timestamptz' })
  windowStart: Date;

  @Index()
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @UpdateDateColumn({ name: 'update_time', type: 'timestamptz' })
  updateTime: Date;
}
