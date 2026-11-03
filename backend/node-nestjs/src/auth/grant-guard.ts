import { Injectable } from '@nestjs/common';
import { BusinessException } from '../common/business-exception';
import type { AuthUser } from './auth-user';

/**
 * Stops a low-privilege account from granting itself more power through the
 * user/role endpoints. Two simple rules: only a super may grant `super`, and a
 * direct permission can only be granted by someone who already has it.
 */
@Injectable()
export class GrantGuard {
  assertCanAssignRoles(roleIds: string[] | null | undefined, actor: AuthUser): void {
    if (!roleIds || roleIds.length === 0) {
      return;
    }
    if (roleIds.includes('super') && !actor.roles.includes('super')) {
      throw BusinessException.validate('只有超级管理员可以授予 super 角色');
    }
  }

  assertCanAssignPermissions(permissionIds: string[] | null | undefined, actor: AuthUser): void {
    if (!permissionIds || permissionIds.length === 0) {
      return;
    }
    for (const permissionId of permissionIds) {
      if (!actor.permissionIds.has(permissionId)) {
        throw BusinessException.validate('不能授予当前账号没有的权限');
      }
    }
  }

  isSuperAdmin(actor: AuthUser): boolean {
    return actor.roles.includes('super');
  }
}
