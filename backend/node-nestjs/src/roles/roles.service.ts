import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth-user';
import { GrantGuard } from '../auth/grant-guard';
import { BusinessException } from '../common/business-exception';
import { STATUS_ALL } from '../common/constants';
import { PageData, buildPageData, toIso } from '../common/page';
import { likePrefix, LIKE_ESCAPE } from '../common/query.util';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { AddRoleDto, EditRoleDto, QueryRoleDto } from './roles.dto';

const ROLE_SORT_FIELDS = new Set(['id', 'name', 'status', 'createTime', 'updateTime']);

export interface RoleBean {
  id: string;
  name: string | null;
  status: string;
  permissions?: string[];
  createTime: string | null;
  updateTime: string | null;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly grantGuard: GrantGuard,
  ) {}

  async list(query: QueryRoleDto): Promise<PageData<RoleBean>> {
    const page = query.page ?? 1;
    const size = query.size ?? 10;

    const builder = this.roles.createQueryBuilder('r');
    if (isNotBlank(query.id)) {
      builder.andWhere(`LOWER(r.id) LIKE :id ${LIKE_ESCAPE}`, { id: likePrefix(query.id) });
    }
    if (isNotBlank(query.name)) {
      builder.andWhere(`LOWER(r.name) LIKE :name ${LIKE_ESCAPE}`, { name: likePrefix(query.name) });
    }
    if (isNotBlank(query.status) && query.status !== STATUS_ALL) {
      builder.andWhere('r.status = :status', { status: query.status });
    }

    const total = await builder.getCount();
    const explicitSort = isNotBlank(query.sort) && ROLE_SORT_FIELDS.has(query.sort as string);
    const sortBy = explicitSort ? (query.sort as string) : 'createTime';
    const direction = resolveDirection(query.direction, explicitSort);

    const rows = await builder
      .orderBy(`r.${sortBy}`, direction.toUpperCase() as 'ASC' | 'DESC')
      .addOrderBy('r.id', 'ASC')
      .skip((page - 1) * size)
      .take(size)
      .getMany();

    return buildPageData(total, rows.map((role) => toRoleBean(role)), page, size);
  }

  async get(id: string): Promise<RoleBean> {
    const role = await this.roles.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) {
      throw BusinessException.notFound('角色不存在');
    }
    return toRoleBean(role, (role.permissions ?? []).map((permission) => permission.id));
  }

  async create(dto: AddRoleDto, actor: AuthUser): Promise<string> {
    let roleId = dto.id?.trim();
    if (!roleId) {
      roleId = randomUUID();
    } else if (await this.roles.existsBy({ id: roleId })) {
      throw BusinessException.conflict('角色ID已存在');
    }

    this.grantGuard.assertCanAssignPermissions(dto.permissions, actor);

    const role = this.roles.create({
      id: roleId,
      name: dto.name,
      permissions: await this.loadPermissions(dto.permissions),
    });
    return (await this.roles.save(role)).id;
  }

  async edit(id: string, dto: EditRoleDto, actor: AuthUser): Promise<void> {
    const role = await this.roles.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) {
      throw BusinessException.notFound('角色不存在');
    }
    if (role.id === 'super' && !this.grantGuard.isSuperAdmin(actor)) {
      throw BusinessException.forbidden('只有超级管理员可以修改 super 角色');
    }

    if (dto.name !== undefined) {
      role.name = dto.name;
    }
    if (dto.status !== undefined) {
      role.status = dto.status;
    }
    if (dto.permissions !== undefined) {
      this.grantGuard.assertCanAssignPermissions(dto.permissions, actor);
      role.permissions = await this.loadPermissions(dto.permissions);
    }
    await this.roles.save(role);
  }

  async remove(ids: string[], actor: AuthUser): Promise<void> {
    const requested = [...new Set(ids)];
    if (requested.length === 0) {
      throw BusinessException.notFound('角色不存在');
    }

    await this.roles.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Role);
      const found = await repository.findBy({ id: In(requested) });
      if (found.length === 0) {
        throw BusinessException.notFound('角色不存在');
      }
      if (found.some((role) => role.id === 'super') && !this.grantGuard.isSuperAdmin(actor)) {
        throw BusinessException.forbidden('只有超级管理员可以删除 super 角色');
      }

      for (const role of found) {
        const references = await manager
          .getRepository(User)
          .createQueryBuilder('user')
          .innerJoin('user.roles', 'role', 'role.id = :id', { id: role.id })
          .getCount();
        if (references > 0) {
          throw BusinessException.conflict(`角色${role.id}已被用户引用，不能删除`);
        }
      }

      if (found.length > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('sys_role_permission')
          .where('role_id IN (:...ids)', { ids: found.map((role) => role.id) })
          .execute();
      }
      await repository.delete({ id: In(found.map((role) => role.id)) });
    });
  }

  private async loadPermissions(ids: string[] | undefined): Promise<Permission[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.permissions.findBy({ id: In(ids) });
  }
}

export function toRoleBean(role: Role, permissions?: string[]): RoleBean {
  const bean: RoleBean = {
    id: role.id,
    name: role.name,
    status: role.status,
    createTime: toIso(role.createTime),
    updateTime: toIso(role.updateTime),
  };
  if (permissions) {
    bean.permissions = permissions;
  }
  return bean;
}

function resolveDirection(direction: string | undefined, explicitSort: boolean): 'asc' | 'desc' {
  if (!isNotBlank(direction)) {
    return explicitSort ? 'asc' : 'desc';
  }
  const normalized = direction!.trim().toLowerCase();
  if (normalized !== 'asc' && normalized !== 'desc') {
    throw BusinessException.validate('排序方向只能是 asc 或 desc');
  }
  return normalized;
}

function isNotBlank(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
