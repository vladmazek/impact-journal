"use client";

import { AlertCircle, CheckCircle2, Cloud, LoaderCircle, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SaveState = "error" | "idle" | "saved" | "saving";

type ReflectionSaveIndicatorProps = {
  completedEntryCount: number;
  errorMessage: string | null;
  hasUnsavedChanges: boolean;
  onRetry: () => void;
  saveState: SaveState;
  updatedAt: string | null;
};

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) {
    return "Nothing saved yet.";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

export function ReflectionSaveIndicator({
  completedEntryCount,
  errorMessage,
  hasUnsavedChanges,
  onRetry,
  saveState,
  updatedAt,
}: ReflectionSaveIndicatorProps) {
  const tone =
    saveState === "error"
      ? {
          body: errorMessage ?? "Saving hit a problem. Your reflection is still here.",
          icon: AlertCircle,
          label: "Save paused",
          textColor: "text-red-700 dark:text-red-200",
        }
      : saveState === "saving"
        ? {
            body: "Saving this week quietly in the background.",
            icon: LoaderCircle,
            label: "Saving",
            textColor: "text-primary",
          }
        : saveState === "saved"
          ? {
              body: `Saved at ${formatUpdatedAt(updatedAt)}.`,
              icon: CheckCircle2,
              label: "Saved",
              textColor: "text-emerald-700 dark:text-emerald-300",
            }
          : hasUnsavedChanges
          ? {
              body: "Changes save when you leave the field or page. A quiet 1-minute safeguard stays on.",
              icon: PenLine,
              label: "Unsaved changes",
              textColor: "text-amber-700 dark:text-amber-300",
            }
            : {
                body: updatedAt
                  ? `Last saved at ${formatUpdatedAt(updatedAt)}.`
                  : "Changes save when you leave the field or page.",
                icon: Cloud,
                label: "Idle",
                textColor: "text-muted-foreground",
              };

  const Icon = tone.icon;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80",
              tone.textColor,
            )}
          >
            <Icon className={cn("h-4 w-4", saveState === "saving" ? "animate-spin" : "")} />
          </span>
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", tone.textColor)}>{tone.label}</p>
            <p className="text-sm leading-6 text-muted-foreground">{tone.body}</p>
          </div>
        </div>
        <span className="rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {completedEntryCount} completed days
        </span>
      </div>

      {saveState === "error" ? (
        <Button className="w-full" onClick={onRetry} type="button" variant="outline">
          Retry save
        </Button>
      ) : null}
    </Card>
  );
}
