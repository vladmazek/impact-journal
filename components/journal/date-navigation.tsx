"use client";

import { useJournalRuntime } from "@/components/journal/journal-runtime";
import { Card } from "@/components/ui/card";
import { type CalendarNavigationMonth } from "@/lib/journal/calendar-navigation";
import { shiftDateSlugByMonths } from "@/lib/date";
import { cn } from "@/lib/utils";

type DateNavigationProps = {
  calendar: CalendarNavigationMonth;
  currentDate: string;
  todayDate: string;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DateNavigation({
  calendar,
  currentDate,
  todayDate,
}: DateNavigationProps) {
  const { isNavigating, navigateToDate, pendingNavigationLabel } = useJournalRuntime();
  const previousDate = shiftDateSlugByMonths(currentDate, -1);
  const rawNextDate = shiftDateSlugByMonths(currentDate, 1);
  const todayMonthKey = todayDate.slice(0, 7);
  const nextMonthKey = rawNextDate.slice(0, 7);
  const isNextDisabled = nextMonthKey > todayMonthKey;
  const nextDate =
    nextMonthKey === todayMonthKey && rawNextDate > todayDate ? todayDate : rawNextDate;

  return (
    <Card className="space-y-4 p-5">
      <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
        <div className="flex items-center justify-center gap-2">
          <button
            aria-label="Previous month"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/80 text-base font-medium text-foreground transition hover:border-primary/25 hover:bg-accent/20"
            disabled={isNavigating}
            onClick={() => void navigateToDate(previousDate)}
            type="button"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <p className="whitespace-nowrap text-xl font-medium tracking-tight text-foreground">
            {calendar.monthLabel}
          </p>
          <button
            aria-label="Next month"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/80 text-base font-medium text-foreground transition hover:border-primary/25 hover:bg-accent/20",
              isNextDisabled ? "cursor-not-allowed opacity-45 hover:bg-card/80" : "",
            )}
            disabled={isNavigating || isNextDisabled}
            onClick={() => void navigateToDate(nextDate)}
            type="button"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>

        {isNavigating ? (
          <div className="mt-3">
            <p className="text-right text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {pendingNavigationLabel
                ? `Saving + loading ${pendingNavigationLabel}`
                : "Saving + loading..."}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {weekdayLabels.map((label) => (
            <div
              className="px-1 text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
              key={label}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-1.5">
          {calendar.weeks.map((week, weekIndex) => (
            <div className="grid grid-cols-7 gap-1.5" key={`${calendar.monthLabel}-${weekIndex}`}>
              {week.map((day) => {
                const dayIndicator = day.moodEmoji ?? (day.hasEntry ? "✍️" : null);
                const isFutureDay = day.date > todayDate;

                return (
                  <button
                    aria-label={`Open ${day.date}`}
                    className={cn(
                      "aspect-square min-w-0 rounded-[18px] border px-1 py-2 text-center transition",
                      day.isCurrentDate
                        ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                        : day.isCurrentMonth
                          ? "border-border/60 bg-card/70 text-foreground hover:border-primary/25 hover:bg-accent/20"
                          : "border-transparent bg-transparent text-muted-foreground/60 hover:bg-accent/10",
                      day.isToday && !day.isCurrentDate ? "border-primary/20" : "",
                      isFutureDay ? "cursor-not-allowed opacity-45 hover:bg-transparent" : "",
                    )}
                    disabled={isNavigating || isFutureDay}
                    key={day.date}
                    onClick={() => void navigateToDate(day.date)}
                    type="button"
                  >
                    <span className="block text-xs font-medium leading-none">{day.dayNumber}</span>
                    <span className="mt-2 block text-base leading-none">
                      {dayIndicator ?? "\u00A0"}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
