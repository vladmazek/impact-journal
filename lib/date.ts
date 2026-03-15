const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  day: "numeric",
});

const shortMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

const shortMonthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
});

const weekdayShortFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
});

export function isValidDateSlug(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function dateSlugToUtcDate(dateSlug: string) {
  if (!isValidDateSlug(dateSlug)) {
    throw new Error(`Invalid date slug: ${dateSlug}`);
  }

  return new Date(`${dateSlug}T00:00:00.000Z`);
}

export function dbDateToDateSlug(date: Date) {
  const year = date.getUTCFullYear().toString();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function shiftDateSlug(dateSlug: string, dayOffset: number) {
  const date = dateSlugToUtcDate(dateSlug);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return dbDateToDateSlug(date);
}

export function formatLongDate(date: Date) {
  return longDateFormatter.format(date);
}

export function formatMonthDay(date: Date) {
  return monthDayFormatter.format(date);
}

export function formatShortMonthDay(date: Date) {
  return shortMonthDayFormatter.format(date);
}

export function formatShortMonthDayYear(date: Date) {
  return shortMonthDayYearFormatter.format(date);
}

export function formatLongDateFromSlug(dateSlug: string) {
  return formatLongDate(dateSlugToUtcDate(dateSlug));
}

export function formatMonthDayFromSlug(dateSlug: string) {
  return formatMonthDay(dateSlugToUtcDate(dateSlug));
}

export function formatShortMonthDayFromSlug(dateSlug: string) {
  return formatShortMonthDay(dateSlugToUtcDate(dateSlug));
}

export function formatWeekdayFromSlug(dateSlug: string) {
  return weekdayFormatter.format(dateSlugToUtcDate(dateSlug));
}

export function formatWeekdayShortFromSlug(dateSlug: string) {
  return weekdayShortFormatter.format(dateSlugToUtcDate(dateSlug));
}

export function formatRelativeEntryHeading(dateSlug: string, todayDateSlug: string) {
  if (dateSlug === todayDateSlug) {
    return "Today";
  }

  if (dateSlug === shiftDateSlug(todayDateSlug, -1)) {
    return "Yesterday";
  }

  if (dateSlug === shiftDateSlug(todayDateSlug, 1)) {
    return "Tomorrow";
  }

  return formatMonthDayFromSlug(dateSlug);
}

export function resolveTodayDateSlug(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to resolve a date slug for timezone ${timeZone}.`);
  }

  return `${year}-${month}-${day}`;
}

export function toDateSlugInTimeZone(date: Date, timeZone: string) {
  return resolveTodayDateSlug(date, timeZone);
}

export function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export type IsoWeekParts = {
  isoWeek: number;
  isoYear: number;
};

function weekdayIndex(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

function startOfIsoWeek(date: Date) {
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - weekdayIndex(date));
  return start;
}

function getIsoWeekCount(isoYear: number) {
  return getIsoWeekPartsFromDateSlug(`${isoYear}-12-28`).isoWeek;
}

export function getIsoWeekPartsFromDateSlug(dateSlug: string): IsoWeekParts {
  const date = dateSlugToUtcDate(dateSlug);
  const target = new Date(date);
  target.setUTCDate(target.getUTCDate() - weekdayIndex(target) + 3);

  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - weekdayIndex(firstThursday) + 3);

  return {
    isoWeek:
      1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)),
    isoYear,
  };
}

export function isValidIsoWeekParts(isoYear: number, isoWeek: number) {
  if (!Number.isInteger(isoYear) || !Number.isInteger(isoWeek)) {
    return false;
  }

  if (isoYear < 1000 || isoYear > 9999) {
    return false;
  }

  return isoWeek >= 1 && isoWeek <= getIsoWeekCount(isoYear);
}

export function getDateSlugForIsoWeekStart(isoYear: number, isoWeek: number) {
  if (!isValidIsoWeekParts(isoYear, isoWeek)) {
    throw new Error(`Invalid ISO week: ${isoYear}-W${isoWeek}`);
  }

  const januaryFourth = new Date(Date.UTC(isoYear, 0, 4));
  const firstWeekStart = startOfIsoWeek(januaryFourth);
  const weekStart = new Date(firstWeekStart);
  weekStart.setUTCDate(firstWeekStart.getUTCDate() + (isoWeek - 1) * 7);

  return dbDateToDateSlug(weekStart);
}

export function getDateSlugsForIsoWeek(isoYear: number, isoWeek: number) {
  const weekStart = getDateSlugForIsoWeekStart(isoYear, isoWeek);

  return Array.from({ length: 7 }, (_, index) => shiftDateSlug(weekStart, index));
}

export function shiftIsoWeek(isoYear: number, isoWeek: number, weekOffset: number) {
  const weekStart = dateSlugToUtcDate(getDateSlugForIsoWeekStart(isoYear, isoWeek));
  weekStart.setUTCDate(weekStart.getUTCDate() + weekOffset * 7);

  return getIsoWeekPartsFromDateSlug(dbDateToDateSlug(weekStart));
}

export function resolveCurrentIsoWeek(date: Date, timeZone: string) {
  return getIsoWeekPartsFromDateSlug(resolveTodayDateSlug(date, timeZone));
}

export function formatIsoWeekLabel(isoYear: number, isoWeek: number) {
  return `Week ${isoWeek}, ${isoYear}`;
}

export function formatIsoWeekRange(isoYear: number, isoWeek: number) {
  const [startDate, , , , , , endDate] = getDateSlugsForIsoWeek(isoYear, isoWeek);
  const start = dateSlugToUtcDate(startDate);
  const end = dateSlugToUtcDate(endDate);

  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${formatShortMonthDay(start)} - ${formatShortMonthDayYear(end)}`;
  }

  return `${formatShortMonthDayYear(start)} - ${formatShortMonthDayYear(end)}`;
}
