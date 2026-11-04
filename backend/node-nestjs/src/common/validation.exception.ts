import { BusinessCode } from './error-code';
import { BusinessException } from './business-exception';

export class ValidationException extends BusinessException {
  constructor(readonly fieldErrors: Record<string, string>) {
    super('校验失败', BusinessCode.VALIDATE_ERROR);
    this.name = 'ValidationException';
  }
}
