import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth-user';
import { GrantGuard } from '../auth/grant-guard';
import { LoginAttemptService } from '../auth/login-attempt.service';
import { BusinessException } from '../common/business-exception';
import { STATUS_ALL, STATUS_DISABLE, STATUS_ENABLE } from '../common/constants';
import { PageData, buildPageData, toIso } from '../common/page';
import { generateTempPassword, hashPassword } from '../common/password.util';
import { likePrefix, LIKE_ESCAPE } from '../common/query.util';
import { Group } from '../entities/group.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { AddUserDto, EditUserDto, QueryUserDto } from './users.dto';

const USER_SORT_FIELDS = new Set([
  'id',
  'name',
  'username',
  'email',
  'status',
  'createTime',
  'updateTime',
]);

export interface UserRoleBean {
  id: string;
  name: string | null;
}

export interface UserBean {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  groupId: string | null;
  groupName: string;
  phone: string | null;
  status: string;
  createTime: string | null;
  updateTime: string | null;
  roles: UserRoleBean[];
  permissions: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(Group)
    private readonly groups: Repository<Group>,
    private readonly grantGuard: GrantGuard,
    private readonly loginAttempts: LoginAttemptService,
  ) {}

  async list(query: QueryUserDto): Promise<PageData<UserBean>> {
    const page = query.page ?? 1;
    const size = query.size ?? 10;

    const builder = this.users.createQueryBuilder('u');
    if (isNotBlank(query.keyword)) {
      builder.andWhere(
        `(LOWER(u.name) LIKE :keyword ${LIKE_ESCAPE} OR LOWER(u.username) LIKE :keyword ${LIKE_ESCAPE} OR LOWER(u.email) LIKE :keyword ${LIKE_ESCAPE} OR LOWER(u.phone) LIKE :keyword ${LIKE_ESCAPE})`,
        { keyword: likePrefix(query.keyword) },
      );
    }
    if (isNotBlank(query.status) && query.status !== STATUS_ALL) {
      builder.andWhere('u.status = :status', { status: query.status });
    }
    if (isNotBlank(query.groupId)) {
      builder.andWhere(`LOWER(u.groupId) LIKE :groupId ${LIKE_ESCAPE}`, {
        groupId: likePrefix(query.groupId),
      });
    }

    const total = await builder.getCount();
    const explicitSort = isNotBlank(query.sort) && USER_SORT_FIELDS.has(query.sort as string);
    const sortBy = explicitSort ? (query.sort as string) : 'createTime';
    const direction = resolveDirection(query.direction, explicitSort);

    const rows = await builder
      .orderBy(`u.${sortBy}`, direction.toUpperCase() as 'ASC' | 'DESC')
      .addOrderBy('u.id', 'ASC')
      .skip((page - 1) * size)
      .take(size)
      .getMany();

    const groupNames = await this.groupNameMap();
    return buildPageData(
      total,
      rows.map((user) => this.toUserBean(user, groupNames)),
      page,
      size,
    );
  }

  async get(id: string): Promise<UserBean> {
    const user = await this.users.findOne({
      where: { id },
      relations: { roles: true, permissions: true },
    });
    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }
    const group = user.groupId ? await this.groups.findOneBy({ id: user.groupId }) : null;
    return this.toUserBean(
      user,
      new Map(user.groupId ? [[user.groupId, group?.name ?? '']] : []),
      (user.roles ?? []).map((role) => ({ id: role.id, name: role.name })),
      (user.permissions ?? []).map((permission) => permission.id),
    );
  }

  async create(dto: AddUserDto, actor: AuthUser): Promise<string> {
    if (await this.users.existsBy({ username: dto.username })) {
      throw BusinessException.conflict('用户名已存在');
    }
    this.grantGuard.assertCanAssignRoles(dto.roles, actor);
    this.grantGuard.assertCanAssignPermissions(dto.permissions, actor);
    if (!dto.groupId || !(await this.groups.existsBy({ id: dto.groupId }))) {
      throw BusinessException.notFound('组织不存在');
    }

    const temporaryPassword = generateTempPassword();
    const user = this.users.create({
      id: randomUUID(),
      name: dto.name,
      username: dto.username,
      email: dto.email,
      groupId: dto.groupId,
      phone: dto.phone,
      status: dto.status ?? STATUS_ENABLE,
      password: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      tokenVersion: 0,
      roles: await this.loadRoles(dto.roles),
      permissions: await this.loadPermissions(dto.permissions),
    });
    await this.users.save(user);
    return temporaryPassword;
  }

  async edit(id: string, dto: EditUserDto, actor: AuthUser): Promise<void> {
    const user = await this.users.findOne({
      where: { id },
      relations: { roles: true, permissions: true },
    });
    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }

    if (dto.username !== undefined && dto.username !== user.username) {
      throw BusinessException.validate('用户名创建后不可修改');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.email !== undefined) {
      user.email = dto.email;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.groupId !== undefined) {
      if (!dto.groupId || !(await this.groups.existsBy({ id: dto.groupId }))) {
        throw BusinessException.notFound('组织不存在');
      }
      user.groupId = dto.groupId;
    }

    if (dto.status !== undefined) {
      const disabling = user.status !== STATUS_DISABLE && dto.status === STATUS_DISABLE;
      if (disabling) {
        this.assertNotSelf(user.id, actor, '禁用');
        await this.assertNotLastSuper(user, '禁用');
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      }
      user.status = dto.status;
    }

    if (dto.roles !== undefined) {
      this.grantGuard.assertCanAssignRoles(dto.roles, actor);
      user.roles = await this.loadRoles(dto.roles);
    }
    if (dto.permissions !== undefined) {
      this.grantGuard.assertCanAssignPermissions(dto.permissions, actor);
      user.permissions = await this.loadPermissions(dto.permissions);
    }

    await this.users.save(user);
  }

  async updateStatus(id: string, status: string, actor: AuthUser): Promise<void> {
    await this.edit(id, { status }, actor);
  }

  async resetPassword(id: string, actor: AuthUser): Promise<string> {
    const user = await this.users.findOne({ where: { id }, relations: { roles: true } });
    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }
    if (hasRole(user, 'super') && !this.grantGuard.isSuperAdmin(actor)) {
      throw BusinessException.validate('无权重置超级管理员密码');
    }

    const temporaryPassword = generateTempPassword();
    user.password = await hashPassword(temporaryPassword);
    user.mustChangePassword = true;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.users.save(user);
    await this.loginAttempts.clearUserAttempts(user.username);
    return temporaryPassword;
  }

  async remove(ids: string[], actor: AuthUser): Promise<void> {
    const requested = [...new Set(ids)];
    if (requested.length === 0) {
      throw BusinessException.notFound('用户不存在');
    }

    await this.users.manager.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const found = await repository.find({
        where: { id: In(requested) },
        relations: { roles: true },
      });
      if (found.length === 0) {
        throw BusinessException.notFound('用户不存在');
      }

      const enabledSupers = await countEnabledSupers(manager.getRepository(User));
      const deletingSupers = found.filter(
        (user) => user.status !== STATUS_DISABLE && hasRole(user, 'super'),
      ).length;
      if (deletingSupers > 0 && enabledSupers - deletingSupers < 1) {
        throw BusinessException.validate('系统至少需要保留一个启用的超级管理员');
      }

      for (const user of found) {
        this.assertNotSelf(user.id, actor, '删除');
      }

      // Grants are not external references: clear them before the user rows.
      const userIds = found.map((user) => user.id);
      await manager
        .createQueryBuilder()
        .delete()
        .from('sys_user_role')
        .where('user_id IN (:...ids)', { ids: userIds })
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from('sys_user_permission')
        .where('user_id IN (:...ids)', { ids: userIds })
        .execute();
      await repository.delete({ id: In(userIds) });
    });
  }

  private async assertNotLastSuper(user: User, action: string): Promise<void> {
    if (!hasRole(user, 'super') || user.status === STATUS_DISABLE) {
      return;
    }
    const enabledSupers = await countEnabledSupers(this.users);
    if (enabledSupers <= 1) {
      throw BusinessException.validate(`系统至少需要保留一个启用的超级管理员，不能${action}`);
    }
  }

  private assertNotSelf(targetId: string, actor: AuthUser, action: string): void {
    if (targetId && targetId === actor.id) {
      throw BusinessException.validate(`不能${action}当前登录用户`);
    }
  }

  private async loadRoles(ids: string[] | undefined): Promise<Role[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.roles.findBy({ id: In(ids) });
  }

  private async loadPermissions(ids: string[] | undefined): Promise<Permission[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.permissions.findBy({ id: In(ids) });
  }

  private async groupNameMap(): Promise<Map<string, string>> {
    const groups = await this.groups.find();
    return new Map(groups.map((group) => [group.id, group.name ?? '']));
  }

  private toUserBean(
    user: User,
    groupNames: Map<string, string>,
    roles?: UserRoleBean[],
    permissions?: string[],
  ): UserBean {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      groupId: user.groupId,
      groupName: user.groupId ? groupNames.get(user.groupId) ?? '' : '',
      phone: user.phone,
      status: user.status,
      createTime: toIso(user.createTime),
      updateTime: toIso(user.updateTime),
      roles: roles ?? [],
      permissions: permissions ?? [],
    };
  }
}

async function countEnabledSupers(users: Repository<User>): Promise<number> {
  return users
    .createQueryBuilder('user')
    .innerJoin('user.roles', 'role', 'role.id = :roleId', { roleId: 'super' })
    .andWhere('user.status = :status', { status: STATUS_ENABLE })
    .getCount();
}

function hasRole(user: User, roleId: string): boolean {
  return (user.roles ?? []).some((role) => role.id === roleId);
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
