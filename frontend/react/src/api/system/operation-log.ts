import axios from "@/lib/axios";
import type { PageResult } from "../types";
import type { components } from "../schema";

type OperationLogContract = components["schemas"]["OperationLogBean"];

export type OperationLog = OperationLogContract & {
  id: number;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  createTime: string;
};

export type OperationLogQuery = components["schemas"]["QueryOperationLogReq"] & {
  page: number;
  size: number;
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
