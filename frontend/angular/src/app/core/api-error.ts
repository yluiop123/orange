/** Normalized failure thrown by the HTTP interceptor. */
export interface ApiError {
  code: number;
  message: string;
  data?: unknown;
  status?: number;
  traceId?: string;
}

export function isApiError(value: unknown): value is ApiError {
  return !!value && typeof value === 'object' && 'code' in value && 'message' in value;
}
