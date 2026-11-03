import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { timestampType } from './column-types';

@Entity('sys_group')
export class Group {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', default: '1' })
  status: string;

  @Column({ name: 'parent_id', type: 'varchar', nullable: true })
  parentId: string | null;

  @CreateDateColumn({ name: 'create_time', type: timestampType(), nullable: true })
  createTime: Date | null;

  @UpdateDateColumn({ name: 'update_time', type: timestampType(), nullable: true })
  updateTime: Date | null;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updatedBy: string | null;

  @VersionColumn({ default: 0 })
  version: number;
}
