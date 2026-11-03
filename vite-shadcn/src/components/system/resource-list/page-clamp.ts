/** 删除后把当前页夹到剩余数据的最后一页。 */
export function clampPageAfterDelete(
  total: number,
  deleted: number,
  size: number,
  currentPage: number,
): number {
  const remaining = Math.max(0, total - deleted);
  const maxPage = Math.max(1, Math.ceil(remaining / size));
  return Math.min(currentPage, maxPage);
}
