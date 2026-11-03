type FieldErrors = Record<string, unknown>

/**
 * Extract the field-error map from a business 400 response.
 * The response envelope carries `data: { field: "message" }`.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const source = error as
    | {
        data?: unknown
        response?: { data?: { data?: unknown } }
      }
    | null
    | undefined
  const candidates: unknown[] = [source?.data, source?.response?.data?.data]
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    const map: Record<string, string> = {}
    for (const [field, message] of Object.entries(candidate as FieldErrors)) {
      if (typeof message === 'string') map[field] = message
    }
    if (Object.keys(map).length > 0) return map
  }
  return {}
}
