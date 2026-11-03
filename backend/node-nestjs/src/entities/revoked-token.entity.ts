import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('sys_revoked_token')
export class RevokedToken {
  @PrimaryColumn({ type: 'varchar' })
  jti: string;

  @Column({ name: 'token_type', type: 'varchar' })
  tokenType: string;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'create_time', type: 'timestamptz' })
  createTime: Date;
}
