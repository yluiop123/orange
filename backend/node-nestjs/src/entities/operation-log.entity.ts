import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_operation_log')
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'trace_id', type: 'varchar', length: 64, nullable: true })
  traceId: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar' })
  method: string;

  @Column({ type: 'varchar' })
  path: string;

  @Column({ name: 'query_string', type: 'varchar', length: 512, nullable: true })
  queryString: string | null;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody: string | null;

  @Column({ type: 'int' })
  status: number;

  @Column({ name: 'duration_ms', type: 'bigint' })
  durationMs: string;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Index()
  @CreateDateColumn({ name: 'create_time', type: 'timestamptz' })
  createTime: Date;
}
