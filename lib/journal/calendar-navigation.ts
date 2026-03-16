import {
  dbDateToDateSlug,
  formatMonthYearFromSlug,
  getDateSlugsForCalendarMonthGrid,
  isValidDateSlug,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";

export type CalendarNavigationDay = {
  date: string;
  dayNumber: number;
  hasEntry: boolean;
  isCurrentDate: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  moodEmoji: string | null;
};

export type CalendarNavigationMonth = {
  monthLabel: string;
  weeks: CalendarNavigationDay[][];
};

export async function loadCalendarNavigationMonthForUser(
  userId: string,
  currentDate: string,
  todayDate: string,
): Promise<CalendarNavigationMonth> {
  if (!isValidDateSlug(currentDate)) {
    throw new Error(`Invalid calendar navigation date: ${currentDate}`);
  }

  const [year, month] = currentDate.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const currentMonthKey = currentDate.slice(0, 7);

  const entries = await prisma.dailyEntry.findMany({
    where: {
      entryDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      userId,
    },
    select: {
      entryDate: true,
      moodEmoji: true,
    },
  });

  const entriesByDate = new Map(
    entries.map((entry) => [
      dbDateToDateSlug(entry.entryDate),
      {
        hasEntry: true,
        moodEmoji: entry.moodEmoji,
      },
    ]),
  );

  return {
    monthLabel: formatMonthYearFromSlug(currentDate),
    weeks: getDateSlugsForCalendarMonthGrid(currentDate).map((week) =>
      week.map((dateSlug) => {
        const entry = entriesByDate.get(dateSlug);

        return {
          date: dateSlug,
          dayNumber: Number(dateSlug.slice(8, 10)),
          hasEntry: entry?.hasEntry ?? false,
          isCurrentDate: dateSlug === currentDate,
          isCurrentMonth: dateSlug.slice(0, 7) === currentMonthKey,
          isToday: dateSlug === todayDate,
          moodEmoji: entry?.moodEmoji ?? null,
        };
      }),
    ),
  };
}
