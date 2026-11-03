import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { STATUS_DISABLE } from '../common/constants';
import { User } from '../entities/user.entity';
import { computeEffectivePermissions } from '../policies/effective-permissions';
import type { AuthUser } from './auth-user';

const FULL_RELATIONS = {
  roles: { permissions: true },
  permissions: true,
} as const;

@Injectable()
export class UserLookupService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.users.findOne({
      where: { username },
      relations: FULL_RELATIONS,
    });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      relations: FULL_RELATIONS,
    });
  }

  /** Fresh principal for every request; permissions are never cached. */
  async loadAuthUser(username: string): Promise<AuthUser | null> {
    const user = await this.findByUsername(username);
    if (!user || user.status === STATUS_DISABLE) {
      return null;
    }
    const effective = computeEffectivePermissions(user);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      status: user.status,
      tokenVersion: user.tokenVersion ?? 0,
      mustChangePassword: !!user.mustChangePassword,
      roles: effective.roles.map((role) => role.id),
      authorities: effective.authorities,
      permissionIds: new Set(effective.permissions.map((permission) => permission.id)),
    };
  }
}
