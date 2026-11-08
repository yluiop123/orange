import { Group } from './group.entity';
import { LoginAttempt } from './login-attempt.entity';
import { OperationLog } from './operation-log.entity';
import { PermissionI18n } from './permission-i18n.entity';
import { Permission } from './permission.entity';
import { RevokedToken } from './revoked-token.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

export {
  Group,
  LoginAttempt,
  OperationLog,
  Permission,
  PermissionI18n,
  RevokedToken,
  Role,
  User,
};

export const ENTITIES = [
  Group,
  Permission,
  PermissionI18n,
  Role,
  User,
  RevokedToken,
  LoginAttempt,
  OperationLog,
];
