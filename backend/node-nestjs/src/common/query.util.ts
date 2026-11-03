/**
 * Escapes a user supplied string into a case-insensitive LIKE prefix pattern.
 * `\`, `%` and `_` are escaped so they are never treated as wildcards.
 */
export function likePrefix(value: string | null | undefined): string {
  const input = value ?? '';
  const escaped = input
    .toLowerCase()
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  return `${escaped}%`;
}

/** Escaped LIKE pattern matching anywhere in the column (operation logs). */
export function likeContains(value: string | null | undefined): string {
  return `%${(value ?? '').toLowerCase().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}

export function splitIds(ids: string | undefined): string[] {
  return (ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}
