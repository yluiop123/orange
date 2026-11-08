import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Permission } from './permission.entity';

/**
 * Localized display name for a permission. The shared schema keys this table
 * by `(permission_id, locale)` and cascades on permission delete; `name` on
 * `sys_permission` stays the default/fallback label.
 */
@Entity('sys_permission_i18n')
export class PermissionI18n {
  @PrimaryColumn({ name: 'permission_id', type: 'varchar' })
  permissionId: string;

  @PrimaryColumn({ type: 'varchar', length: 16 })
  locale: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission?: Permission;
}
