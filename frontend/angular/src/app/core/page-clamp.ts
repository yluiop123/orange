/** Clamp the current page after deleting rows so the list never goes empty. */
export function clampPageAfterDelete(
  total: number,
  deleted: number,
  size: number,
  currentPage: number,
): number {
  const remaining = Math.max(0, total - deleted);
  const maxPage = Math.max(1, Math.ceil(remaining / Math.max(1, size)));
  return Math.min(Math.max(1, currentPage), maxPage);
}

export function clampPage(page: number, total: number, size: number): number {
  const maxPage = Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, size)));
  return Math.min(Math.max(1, page), maxPage);
}
