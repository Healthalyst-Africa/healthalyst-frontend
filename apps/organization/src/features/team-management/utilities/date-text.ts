const DATE_TEXT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in the browser's time zone, as `YYYY-MM-DD`. */
export function todayAsDateText(today: Date = new Date()): string {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True for a real calendar date written as `YYYY-MM-DD`. */
export function isDateText(value: string): boolean {
  if (!DATE_TEXT_PATTERN.test(value)) return false;
  const parsedDate = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().startsWith(value)
  );
}

/** `2026-11-30` as `30 Nov 2026`, for dates without a time of day. */
export function formatDateText(value: string): string {
  if (!isDateText(value)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
