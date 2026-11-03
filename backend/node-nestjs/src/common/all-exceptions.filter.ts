import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { OptimisticLockVersionMismatchError, QueryFailedError } from 'typeorm';
import { AppRequest } from './app-request';
import { BusinessException } from './business-exception';
import { BusinessCode, DEFAULT_MESSAGES, httpStatusOf } from './error-code';
import { errorEnvelope } from './response';
import { newTraceId } from './trace-id';
import { ValidationException } from './validation.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AppRequest>();
    const traceId = request?.traceId ?? newTraceId();

    if (response.headersSent) {
      return;
    }

    const mapped = this.map(exception);
    if (mapped.status >= 500) {
      this.logger.error(
        `[${traceId}] ${request?.method} ${request?.originalUrl} -> ${mapped.code} ${mapped.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${traceId}] ${request?.method} ${request?.originalUrl} -> ${mapped.code} ${mapped.message}`,
      );
    }

    response.setHeader('X-Trace-Id', traceId);
    response.status(mapped.status).json(errorEnvelope(mapped.code, mapped.message, traceId, mapped.data));
  }

  private map(exception: unknown): {
    code: number;
    message: string;
    status: number;
    data?: unknown;
  } {
    if (exception instanceof ValidationException) {
      return {
        code: BusinessCode.PARAM_ERROR,
        message: DEFAULT_MESSAGES[BusinessCode.PARAM_ERROR],
        status: 400,
        data: exception.fieldErrors,
      };
    }

    if (exception instanceof BusinessException) {
      return {
        code: exception.code,
        message: exception.message,
        status: httpStatusOf(exception.code),
      };
    }

    if (exception instanceof OptimisticLockVersionMismatchError) {
      return {
        code: BusinessCode.CONFLICT,
        message: '数据冲突，请刷新后重试',
        status: 409,
      };
    }

    if (exception instanceof QueryFailedError) {
      const driverCode = (exception as QueryFailedError & { driverError?: { code?: string } }).driverError?.code;
      if (driverCode === '23505' || driverCode === '23503' || driverCode === '23502') {
        return {
          code: BusinessCode.CONFLICT,
          message: '数据冲突，请刷新后重试',
          status: 409,
        };
      }
      return {
        code: BusinessCode.SYSTEM_ERROR,
        message: DEFAULT_MESSAGES[BusinessCode.SYSTEM_ERROR],
        status: 500,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = codeForHttpStatus(status);
      return {
        code,
        message: DEFAULT_MESSAGES[code] ?? exception.message,
        status,
      };
    }

    return {
      code: BusinessCode.SYSTEM_ERROR,
      message: DEFAULT_MESSAGES[BusinessCode.SYSTEM_ERROR],
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}

function codeForHttpStatus(status: number): BusinessCode {
  switch (status) {
    case 400:
      return BusinessCode.PARAM_ERROR;
    case 401:
      return BusinessCode.UNAUTHORIZED;
    case 403:
      return BusinessCode.AUTH_DENIED;
    case 404:
      return BusinessCode.NOT_FOUND;
    case 405:
      return BusinessCode.METHOD_NOT_ALLOWED;
    case 409:
      return BusinessCode.CONFLICT;
    default:
      return BusinessCode.SYSTEM_ERROR;
  }
}
