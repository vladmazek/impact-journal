"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { shiftDateSlug } from "@/lib/date";
import { buttonVariants } from "@/components/ui/button";
import { useJournalRuntime } from "@/components/journal/journal-runtime";
import { cn } from "@/lib/utils";

type DateNavigationProps = {
  currentDate: string;
  todayDate: string;
};

export function DateNavigation({
  currentDate,
  todayDate,
}: DateNavigationProps) {
  const { isNavigating, navigateToDate, pendingDate } = useJournalRuntime();
  const [pickerValue, setPickerValue] = useState(currentDate);

  useEffect(() => {
    setPickerValue(currentDate);
  }, [currentDate]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}
        disabled={isNavigating}
        onClick={() => void navigateToDate(shiftDateSlug(currentDate, -1))}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <button
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}
        disabled={isNavigating}
        onClick={() => void navigateToDate(shiftDateSlug(currentDate, 1))}
        type="button"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>

      <button
        className={cn(
          buttonVariants({
            size: "sm",
            variant: currentDate === todayDate ? "secondary" : "ghost",
          }),
          "rounded-full",
        )}
        disabled={isNavigating}
        onClick={() => void navigateToDate(todayDate)}
        type="button"
      >
        <Clock3 className="h-4 w-4" />
        Today
      </button>

      <label className="relative flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-2 text-sm text-muted-foreground shadow-sm">
        <CalendarDays className="h-4 w-4 text-primary" />
        <input
          aria-label="Choose journal date"
          className="w-[9.5rem] bg-transparent text-foreground outline-none"
          disabled={isNavigating}
          onChange={(event) => {
            const nextDate = event.currentTarget.value;
            setPickerValue(nextDate);
            if (nextDate) {
              void navigateToDate(nextDate);
            }
          }}
          onBlur={() => {
            setPickerValue(currentDate);
          }}
          type="date"
          value={pickerValue}
        />
      </label>

      {isNavigating ? (
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {pendingDate ? `Saving + loading ${pendingDate}` : "Loading..."}
        </span>
      ) : null}
    </div>
  );
}
