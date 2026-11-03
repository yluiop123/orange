import { BusinessCode } from './error-code';

/**
 * Business failure carrying the canonical business code. When no code is given
 * the message is classified exactly like the Java reference, so ported call
 * sites keep the same HTTP status.
 */
export class BusinessException extends Error {
  readonly code: BusinessCode;

  constructor(message: string, code?: BusinessCode) {
    super(message && message.trim().length > 0 ? message : '校验失败');
    this.name = 'BusinessException';
    this.code = code ?? resolveCode(this.message);
  }

  static notFound(message: string): BusinessException {
    return new BusinessException(message, BusinessCode.NOT_FOUND);
  }

  static conflict(message: string): BusinessException {
    return new BusinessException(message, BusinessCode.CONFLICT);
  }

  static validate(message: string): BusinessException {
    return new BusinessException(message, BusinessCode.VALIDATE_ERROR);
  }

  static param(message: string): BusinessException {
    return new BusinessException(message, BusinessCode.PARAM_ERROR);
  }

  static unauthorized(message = '未登录'): BusinessException {
    return new BusinessException(message, BusinessCode.UNAUTHORIZED);
  }

  static forbidden(message = '无权限'): BusinessException {
    return new BusinessException(message, BusinessCode.AUTH_DENIED);
  }

  static passwordChangeRequired(): BusinessException {
    return new BusinessException('请先修改初始密码', BusinessCode.PASSWORD_CHANGE_REQUIRED);
  }
}

function resolveCode(message: string): BusinessCode {
  if (message.includes('不存在')) {
    return BusinessCode.NOT_FOUND;
  }
  if (message.includes('已存在') || message.includes('已被') || message.includes('不能删除')) {
    return BusinessCode.CONFLICT;
  }
  return BusinessCode.VALIDATE_ERROR;
}
