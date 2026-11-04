/**
 * Formats an API timestamp in the browser locale, matching the React
 * reference (`Intl.DateTimeFormat` medium date + short time).
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return '';
  // Historical API values use "yyyy-MM-dd HH:mm:ssXXX"; some browsers reject
  // the space-separated form, so normalise it before parsing.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? value.replace(' ', 'T')
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
