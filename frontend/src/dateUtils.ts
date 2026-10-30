// Formats a Date as YYYY-MM-DD in the user's local timezone.
// (toISOString() would give the UTC date, which is off by a day in the evening for US timezones.)
export const toLocalDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
