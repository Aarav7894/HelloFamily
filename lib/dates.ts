export function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysAgo(n: number): Date {
  const date = startOfToday();
  date.setDate(date.getDate() - n);
  return date;
}

// Local calendar date as "YYYY-MM-DD" — NOT date.toISOString(), which is UTC
// and rolls over to the next day for evening local times behind UTC.
export function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date, n: number): string {
  if (n === 0) return "Today";
  if (n === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Formats a timestamp relative to now, e.g. "today at 9:24 AM" or
// "on Mon, Aug 11 at 9:24 AM" — never a bare ISO date.
export function formatCheckInMoment(iso: string): string {
  const date = new Date(iso);
  const time = formatTime(date);
  if (isSameDay(date, new Date())) return `today at ${time}`;
  if (isSameDay(date, daysAgo(1))) return `yesterday at ${time}`;
  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `on ${day} at ${time}`;
}

// Formats a date-only string (e.g. daily_statuses.status_date) as
// "Today" / "Yesterday" / "Wed, Aug 13", for list rows spanning many days.
export function formatStatusDateLabel(statusDate: string): string {
  const date = new Date(`${statusDate}T00:00:00`);
  const diffDays = Math.round(
    (startOfToday().getTime() - date.getTime()) / 86_400_000,
  );
  return formatShortDate(date, diffDays);
}
