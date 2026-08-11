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

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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
