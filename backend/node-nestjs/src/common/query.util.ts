/**
 * Escape character used by every `LIKE` predicate in the stack.
 *
 * `!` is not special in a SQL string literal or as a wildcard in any of the
 * supported engines, unlike the default `\` (PostgreSQL/MySQL) which SQLite
 * does not treat as an escape character at all. Every query therefore appends
 * `ESCAPE '!'`, and the two helpers below escape `!`, `%` and `_`.
 */
import { BusinessException } from './business-exception';

export const LIKE_ESCAPE = "ESCAPE '!'";

function escapeLike(value: string): string {
  return value
    .replace(/!/g, '!!')
    .replace(/%/g, '!%')
    .replace(/_/g, '!_');
}

/** Escapes a user supplied string into a case-insensitive LIKE prefix pattern. */
export function likePrefix(value: string | null | undefined): string {
  return `${escapeLike((value ?? '').toLowerCase())}%`;
}

/** Escaped LIKE pattern matching anywhere in the column (operation logs). */
export function likeContains(value: string | null | undefined): string {
  return `%${escapeLike((value ?? '').toLowerCase())}%`;
}

export function splitIds(ids: string | undefined): string[] {
  return (ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/** The `?ids=` batch-delete parameter: missing or blank is a 40001. */
export function requiredIds(ids: string | undefined): string[] {
  const list = splitIds(ids);
  if (list.length === 0) {
    throw BusinessException.param('ids 不能为空');
  }
  return list;
}
