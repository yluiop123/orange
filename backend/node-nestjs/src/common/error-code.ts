/**
 * Business codes shared by every backend implementation. The HTTP status is
 * derived from the code, so a client can rely on both.
 */
export enum BusinessCode {
  SUCCESS = 200,
  PARAM_ERROR = 40001,
  VALIDATE_ERROR = 40002,
  UNAUTHORIZED = 40101,
  AUTH_DENIED = 40301,
  PASSWORD_CHANGE_REQUIRED = 40302,
  NOT_FOUND = 40401,
  METHOD_NOT_ALLOWED = 40501,
  CONFLICT = 40901,
  SYSTEM_ERROR = 50000,
  /** Login lockout — the reference backend returns HTTP 429 with code 429. */
  RATE_LIMITED = 429,
}

export const HTTP_STATUS_BY_CODE: Record<number, number> = {
  [BusinessCode.SUCCESS]: 200,
  [BusinessCode.PARAM_ERROR]: 400,
  [BusinessCode.VALIDATE_ERROR]: 400,
  [BusinessCode.UNAUTHORIZED]: 401,
  [BusinessCode.AUTH_DENIED]: 403,
  [BusinessCode.PASSWORD_CHANGE_REQUIRED]: 403,
  [BusinessCode.NOT_FOUND]: 404,
  [BusinessCode.METHOD_NOT_ALLOWED]: 405,
  [BusinessCode.CONFLICT]: 409,
  [BusinessCode.SYSTEM_ERROR]: 500,
  [BusinessCode.RATE_LIMITED]: 429,
};

export const DEFAULT_MESSAGES: Record<number, string> = {
  [BusinessCode.SUCCESS]: 'success',
  [BusinessCode.PARAM_ERROR]: '参数错误',
  [BusinessCode.VALIDATE_ERROR]: '校验失败',
  [BusinessCode.UNAUTHORIZED]: '未登录',
  [BusinessCode.AUTH_DENIED]: '无权限',
  [BusinessCode.PASSWORD_CHANGE_REQUIRED]: '请先修改初始密码',
  [BusinessCode.NOT_FOUND]: '数据不存在',
  [BusinessCode.METHOD_NOT_ALLOWED]: '方法不允许',
  [BusinessCode.CONFLICT]: '数据冲突',
  [BusinessCode.SYSTEM_ERROR]: '系统异常',
  [BusinessCode.RATE_LIMITED]: '登录失败次数过多，请稍后再试',
};

export function httpStatusOf(code: number): number {
  return HTTP_STATUS_BY_CODE[code] ?? 500;
}
