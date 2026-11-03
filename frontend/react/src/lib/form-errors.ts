import type { MutableRefObject } from "react";

type FormRef = MutableRefObject<{
  setError: (
    name: string,
    error: { type: string; message: string },
  ) => void;
} | null>;

function fieldErrors(error: unknown): Record<string, unknown> | null {
  const direct = (error as { data?: unknown } | null)?.data;
  if (direct && typeof direct === "object") {
    return direct as Record<string, unknown>;
  }
  const responseData = (error as { response?: { data?: unknown } } | null)?.response
    ?.data as { data?: unknown } | undefined;
  if (responseData?.data && typeof responseData.data === "object") {
    return responseData.data as Record<string, unknown>;
  }
  return null;
}

/**
 * 把后端 40001 的字段错误映射回表单。
 * 兼容两种错误形态：axios 拦截器 reject 的业务响应体，以及 HTTP 400 的 AxiosError。
 */
export function applyServerFieldErrors(formRef: FormRef, error: unknown) {
  const data = fieldErrors(error);
  if (!data) return;
  for (const [field, message] of Object.entries(data)) {
    if (typeof message !== "string") continue;
    formRef.current?.setError(field, { type: "server", message });
  }
}
