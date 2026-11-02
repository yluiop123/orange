/** 按浏览器本地时区格式化服务端时间；无法解析时原样返回。 */
export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "";
  }
  // 后端历史格式是 "yyyy-MM-dd HH:mm:ssXXX"，部分浏览器不接受空格分隔
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? value.replace(" ", "T")
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
