import { BusinessCode } from './error-code';
import { BusinessException } from './business-exception';

export class ValidationException extends BusinessException {
  constructor(readonly fieldErrors: Record<string, string>) {
    super('参数错误', BusinessCode.PARAM_ERROR);
    this.name = 'ValidationException';
  }
}
