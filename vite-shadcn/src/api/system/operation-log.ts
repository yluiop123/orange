import axios from "@/lib/axios";
import type { PageResult } from "../types";

export type OperationLog = {
  id: number;
  traceId?: string;
  username?: string;
  method: string;
  path: string;
  queryString?: string;
  requestBody?: string;
  status: number;
  durationMs: number;
  ip?: string;
  createTime: string;
};

export type OperationLogQuery = {
  page: number;
  size: number;
  username?: string;
  path?: string;
  status?: string;
  from?: string;
  to?: string;
};

export async function listOperationLogs(
  params: OperationLogQuery,
  signal?: AbortSignal,
) {
  const res = await axios.get<{ data: PageResult<OperationLog> }>(
    "/system/operation-logs",
    { params, signal },
  );
  return res.data.data;
}
