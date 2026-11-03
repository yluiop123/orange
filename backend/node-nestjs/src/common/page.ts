export interface PageData<T> {
  total: number;
  list: T[];
  page: number;
  size: number;
  totalPages: number;
}

export function buildPageData<T>(total: number, list: T[], page: number, size: number): PageData<T> {
  const safeSize = size > 0 ? size : 10;
  return {
    total,
    list,
    page,
    size: safeSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeSize),
  };
}

/** ISO-8601 with offset, matching the shared contract. */
export function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
