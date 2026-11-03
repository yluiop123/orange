import { BusinessException } from '../common/business-exception';

/**
 * `type` + `action` combination rules. A blank action counts as "no action";
 * services normalize it to NULL before persisting so the table has one
 * representation.
 */
export class PermissionShapePolicy {
  static validate(type: string, action: string | null | undefined): void {
    if (type === 'action') {
      if (isBlank(action)) {
        throw BusinessException.validate('action 类型的权限必须填写 action');
      }
      return;
    }
    if (type === 'menu' || type === 'directory') {
      if (!isBlank(action)) {
        throw BusinessException.validate('menu/directory 类型的权限不能填写 action');
      }
    }
  }
}

function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}
