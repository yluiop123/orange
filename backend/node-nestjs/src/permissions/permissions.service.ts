import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BusinessException } from '../common/business-exception';
import { STATUS_ALL, STATUS_DISABLE, STATUS_ENABLE } from '../common/constants';
import { toIso } from '../common/page';
import { likePrefix, LIKE_ESCAPE } from '../common/query.util';
import { TreeCodePolicy, trimToNull } from '../common/tree-code.policy';
import { TreeIndex } from '../common/tree-index';
import { PermissionI18n } from '../entities/permission-i18n.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { PermissionShapePolicy } from '../policies/permission-shape.policy';
import { AddChildPermissionDto, EditPermissionDto, QueryPermissionDto } from './permissions.dto';

export interface PermissionBean {
  id: string;
  name: string | null;
  path: string;
  action: string | null;
  type: string;
  status: string;
  parentId: string | null;
  createTime: string | null;
  updateTime: string | null;
  translations: Record<string, string>;
}

export function toPermissionBean(
  permission: Permission,
  translations: Record<string, string> = {},
): PermissionBean {
  return {
    id: permission.id,
    name: permission.name,
    path: permission.path,
    action: permission.action,
    type: permission.type,
    status: permission.status,
    parentId: permission.parentId,
    createTime: toIso(permission.createTime),
    updateTime: toIso(permission.updateTime),
    translations,
  };
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(PermissionI18n)
    private readonly translations: Repository<PermissionI18n>,
  ) {}

  async list(query: QueryPermissionDto): Promise<PermissionBean[]> {
    const builder = this.permissions.createQueryBuilder('p');
    if (isNotBlank(query.id)) {
      builder.andWhere(`LOWER(p.id) LIKE :id ${LIKE_ESCAPE}`, { id: likePrefix(query.id) });
    }
    if (isNotBlank(query.name)) {
      builder.andWhere(`LOWER(p.name) LIKE :name ${LIKE_ESCAPE}`, { name: likePrefix(query.name) });
    }
    if (isNotBlank(query.path)) {
      builder.andWhere(`LOWER(p.path) LIKE :path ${LIKE_ESCAPE}`, { path: likePrefix(query.path) });
    }
    if (isNotBlank(query.status) && query.status !== STATUS_ALL) {
      builder.andWhere('p.status = :status', { status: query.status });
    }
    if (isNotBlank(query.type) && query.type !== STATUS_ALL) {
      builder.andWhere('p.type = :type', { type: query.type });
    }
    builder.orderBy('p.id', 'ASC');

    const matched = await builder.getMany();
    const textFilter =
      isNotBlank(query.id) ||
      isNotBlank(query.name) ||
      isNotBlank(query.path) ||
      (isNotBlank(query.type) && query.type !== STATUS_ALL);
    const result = textFilter ? await this.includeAncestors(matched) : matched;
    const translations = await this.loadTranslations(result.map((permission) => permission.id));
    return result.map((permission) =>
      toPermissionBean(permission, translations.get(permission.id) ?? {}),
    );
  }

  async get(id: string): Promise<PermissionBean> {
    const permission = await this.requirePermission(id);
    const translations = await this.loadTranslations([permission.id]);
    return toPermissionBean(permission, translations.get(permission.id) ?? {});
  }

  async addChild(dto: AddChildPermissionDto): Promise<PermissionBean> {
    const id = dto.id;
    const parentId = trimToNull(dto.parentId);
    const path = requirePath(dto.path);
    const action = trimToNull(dto.action);

    TreeCodePolicy.PERMISSION.validate(id, parentId);
    PermissionShapePolicy.validate(dto.type, action);
    if (await this.permissions.existsBy({ id })) {
      throw BusinessException.conflict('权限编码已存在');
    }

    let parent: Permission | null = null;
    if (parentId !== null) {
      parent = await this.permissions.findOneBy({ id: parentId });
      if (!parent) {
        throw BusinessException.notFound('父权限不存在');
      }
      if (parent.type === 'action') {
        throw BusinessException.validate('动作权限不能添加子节点');
      }
    }

    await this.assertUnique(dto.type, path, action, null);

    const permission = this.permissions.create({
      id,
      name: dto.name,
      path,
      action,
      type: dto.type,
      status: STATUS_ENABLE,
      parentId: parent?.id ?? null,
    });
    return this.permissions.manager.transaction(async (manager) => {
      const saved = await manager.getRepository(Permission).save(permission);
      const rows = toTranslationRows(id, dto.translations);
      if (rows.length > 0) {
        await manager.getRepository(PermissionI18n).save(rows);
      }
      return toPermissionBean(saved, translationsOf(rows));
    });
  }

  async edit(id: string, dto: EditPermissionDto): Promise<void> {
    const permission = await this.requirePermission(id);

    const effectiveType = dto.type ?? permission.type;
    const effectivePath = dto.path !== undefined ? requirePath(dto.path) : requirePath(permission.path);
    const effectiveAction =
      dto.action !== undefined ? trimToNull(dto.action) : trimToNull(permission.action);

    PermissionShapePolicy.validate(effectiveType, effectiveAction);
    await this.assertUnique(effectiveType, effectivePath, effectiveAction, id);

    if (dto.name !== undefined) {
      permission.name = dto.name;
    }
    if (dto.path !== undefined) {
      permission.path = effectivePath;
    }
    if (dto.action !== undefined) {
      permission.action = effectiveAction;
    }
    if (dto.type !== undefined) {
      permission.type = dto.type;
    }
    if (dto.status !== undefined) {
      const disabling = permission.status !== STATUS_DISABLE && dto.status === STATUS_DISABLE;
      if (disabling) {
        await this.assertNoEnabledDescendants(permission.id);
      }
      permission.status = dto.status;
    }
    await this.permissions.manager.transaction(async (manager) => {
      await manager.getRepository(Permission).save(permission);
      if (dto.translations !== undefined) {
        const repository = manager.getRepository(PermissionI18n);
        await repository.delete({ permissionId: id });
        const rows = toTranslationRows(id, dto.translations);
        if (rows.length > 0) {
          await repository.save(rows);
        }
      }
    });
  }

  async remove(ids: string[]): Promise<void> {
    const requested = [...new Set(ids)];
    if (requested.length === 0) {
      throw BusinessException.notFound('权限不存在');
    }

    await this.permissions.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Permission);
      const all = await repository.find();
      const index = new TreeIndex(all, (permission) => permission.id, (permission) => permission.parentId);

      for (const id of requested) {
        if (!index.get(id)) {
          throw BusinessException.notFound('权限不存在');
        }
      }

      const subtree = [...index.subtreeIds(requested)];

      const roleReferences = await manager
        .getRepository(Role)
        .createQueryBuilder('role')
        .innerJoin('role.permissions', 'permission', 'permission.id IN (:...ids)', { ids: subtree })
        .getCount();
      if (roleReferences > 0) {
        throw BusinessException.conflict('权限已被角色引用，不能删除');
      }

      const userReferences = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.permissions', 'permission', 'permission.id IN (:...ids)', { ids: subtree })
        .getCount();
      if (userReferences > 0) {
        throw BusinessException.conflict('权限已被用户引用，不能删除');
      }

      await manager
        .getRepository(PermissionI18n)
        .delete({ permissionId: In(subtree) });

      for (const permission of index.deleteOrder(subtree)) {
        await repository.delete({ id: permission.id });
      }
    });
  }

  private async requirePermission(id: string): Promise<Permission> {
    const permission = await this.permissions.findOneBy({ id });
    if (!permission) {
      throw BusinessException.notFound('权限不存在');
    }
    return permission;
  }

  private async assertUnique(
    type: string,
    path: string,
    action: string | null,
    excludeId: string | null,
  ): Promise<void> {
    const builder = this.permissions
      .createQueryBuilder('p')
      .where('p.type = :type', { type })
      .andWhere('p.path = :path', { path });
    if (action === null) {
      builder.andWhere('p.action IS NULL');
    } else {
      builder.andWhere('p.action = :action', { action });
    }
    if (excludeId !== null) {
      builder.andWhere('p.id != :excludeId', { excludeId });
    }
    if ((await builder.getCount()) > 0) {
      throw BusinessException.conflict('权限已存在');
    }
  }

  private async assertNoEnabledDescendants(id: string): Promise<void> {
    const all = await this.permissions.find();
    const index = new TreeIndex(all, (permission) => permission.id, (permission) => permission.parentId);
    if (index.hasEnabledDescendant(id, (permission) => permission.status === STATUS_ENABLE)) {
      throw BusinessException.validate('请先禁用子权限');
    }
  }

  private async includeAncestors(matched: Permission[]): Promise<Permission[]> {
    const all = await this.permissions.find({ order: { id: 'ASC' } });
    const index = new TreeIndex(all, (permission) => permission.id, (permission) => permission.parentId);
    const ids = index.withAncestorIds(matched);
    return all.filter((permission) => ids.has(permission.id));
  }

  private async loadTranslations(ids: string[]): Promise<Map<string, Record<string, string>>> {
    const byPermission = new Map<string, Record<string, string>>();
    if (ids.length === 0) {
      return byPermission;
    }
    const rows = await this.translations.find({
      where: { permissionId: In([...new Set(ids)]) },
      order: { locale: 'ASC' },
    });
    for (const row of rows) {
      let record = byPermission.get(row.permissionId);
      if (!record) {
        record = {};
        byPermission.set(row.permissionId, record);
      }
      record[row.locale] = row.name;
    }
    return byPermission;
  }
}

/** Collapses case-insensitively duplicate locale keys, keeping the last value. */
function toTranslationRows(
  permissionId: string,
  translations: Record<string, string> | undefined,
): PermissionI18n[] {
  if (!translations) {
    return [];
  }
  const byLocale = new Map<string, PermissionI18n>();
  for (const [locale, name] of Object.entries(translations)) {
    const row = new PermissionI18n();
    row.permissionId = permissionId;
    row.locale = locale;
    row.name = name;
    byLocale.set(locale.toLowerCase(), row);
  }
  return [...byLocale.values()];
}

function translationsOf(rows: PermissionI18n[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const row of rows) {
    record[row.locale] = row.name;
  }
  return record;
}

function requirePath(path: string | null | undefined): string {
  const normalized = trimToNull(path);
  if (normalized === null) {
    throw BusinessException.validate('权限路径不能为空');
  }
  return normalized;
}

function isNotBlank(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
