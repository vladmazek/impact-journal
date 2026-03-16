"use client";

import { DAILY_MOODS } from "@/lib/journal/daily-entry-shared";
import { cn } from "@/lib/utils";

type MoodPickerProps = {
  value: string | null;
  onChange: (value: {
    emoji: string | null;
    label: string | null;
    value: string | null;
  }) => void;
};

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {DAILY_MOODS.map((mood) => {
        const isActive = mood.value === value;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "group flex min-h-[9.75rem] min-w-0 flex-col items-center justify-center rounded-[26px] border px-4 py-5 text-center transition-all",
              isActive
                ? "border-primary/45 bg-primary/10 shadow-sm"
                : "border-border/70 bg-background/75 hover:border-primary/30 hover:bg-accent/20",
            )}
            key={mood.value}
            onClick={() => {
              if (isActive) {
                onChange({ emoji: null, label: null, value: null });
                return;
              }

              onChange(mood);
            }}
            type="button"
          >
            <span className="block text-2xl" role="img" aria-hidden="true">
              {mood.emoji}
            </span>
            <span className="mt-3 block whitespace-nowrap text-[12px] font-medium leading-tight text-foreground sm:text-[13px]">
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
