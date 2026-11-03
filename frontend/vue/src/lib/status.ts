export const STATUS_ENABLED = '1' as const
export const STATUS_DISABLED = '0' as const

export type Status = typeof STATUS_ENABLED | typeof STATUS_DISABLED

export function isStatusEnabled(status?: string): boolean {
  return status === STATUS_ENABLED
}

export type StatusFilterValue = Status | 'all'
