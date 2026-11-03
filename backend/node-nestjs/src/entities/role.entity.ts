import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Permission } from './permission.entity';
import { timestampType } from './column-types';

@Entity('sys_role')
export class Role {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', default: '1' })
  status: string;

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

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'sys_role_permission',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
