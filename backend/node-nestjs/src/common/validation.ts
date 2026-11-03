import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ValidationException } from './validation.exception';

/**
 * Bean-validation equivalent: rejects invalid writes with the Java backend's
 * 40001 envelope and a `{ field: message }` payload.
 */
export function buildValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: false,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors: ValidationError[]) => new ValidationException(flatten(errors)),
  });
}

function flatten(errors: ValidationError[], parent = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const [firstMessage] = Object.values(error.constraints ?? {});
    if (firstMessage) {
      result[path] = firstMessage;
    }
    if (error.children && error.children.length > 0) {
      Object.assign(result, flatten(error.children, path));
    }
  }
  return result;
}
