import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { timestampType } from './column-types';

@Entity('sys_permission')
@Index(['parentId', 'id'])
export class Permission {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ name: 'name_en', type: 'varchar', nullable: true })
  nameEn: string | null;

  @Column({ type: 'varchar' })
  path: string;

  @Column({ type: 'varchar', nullable: true })
  action: string | null;

  @Column({ type: 'varchar' })
  type: string;

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
