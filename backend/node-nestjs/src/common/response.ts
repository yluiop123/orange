export interface ResponseEnvelope<T> {
  code: number;
  message: string;
  data: T | null;
  timestamp: number;
  traceId: string;
}

export function successEnvelope<T>(data: T, traceId: string, message = 'success'): ResponseEnvelope<T> {
  return {
    code: 200,
    message,
    data: data === undefined ? null : data,
    timestamp: Date.now(),
    traceId,
  };
}

export function errorEnvelope(
  code: number,
  message: string,
  traceId: string,
  data: unknown = null,
): ResponseEnvelope<unknown> {
  return {
    code,
    message,
    data,
    timestamp: Date.now(),
    traceId,
  };
}

/**
 * Marks a controller return value that needs a custom success message, e.g.
 * `change-password` where the frontend surfaces `message` to the user.
 */
export class ApiResult<T> {
  constructor(
    readonly data: T,
    readonly message = 'success',
  ) {}

  static message(message: string): ApiResult<string> {
    return new ApiResult(message, message);
  }

  static of<T>(data: T, message = 'success'): ApiResult<T> {
    return new ApiResult(data, message);
  }
}
