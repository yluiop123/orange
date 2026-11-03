import http from './http'
import type { Envelope, OperationLog, OperationLogQuery, PageResult } from './types'

export async function listOperationLogs(params: OperationLogQuery, signal?: AbortSignal) {
  const response = await http.get<Envelope<PageResult<OperationLog>>>('/system/operation-logs', {
    params,
    signal,
  })
  return response.data.data
}
