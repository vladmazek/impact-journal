"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Heart, Sparkles, TrendingUp } from "lucide-react";

import { saveWeeklyReflectionAction } from "@/lib/actions/weekly-reflection";
import {
  WEEKLY_LIFE_AREAS,
  normalizeWeeklyReflectionDraft,
  weeklyDraftsMatch,
  type WeeklyLifeAreaKey,
  type WeeklyReflectionDraft,
  type WeeklyReflectionRecord,
} from "@/lib/journal/weekly-reflection-shared";
import { EntrySection } from "@/components/journal/entry-section";
import { GuardedLink } from "@/components/journal/guarded-link";
import {
  type TopbarSaveStatus,
  useJournalRuntime,
} from "@/components/journal/journal-runtime";
import { MoodPicker } from "@/components/journal/mood-picker";
import { WritingModal } from "@/components/journal/writing-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WeeklyReflectionPageProps = {
  reflection: WeeklyReflectionRecord;
};

type SaveState = "error" | "idle" | "saved" | "saving";
type LongFieldName =
  | "feltOff"
  | "hardMoments"
  | "nextWeekIntention"
  | "summaryContext"
  | "wins";

const SAVE_GUARD_INTERVAL_MS = 60_000;

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) {
    return "Nothing saved yet.";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

function buildWeeklyTopbarSaveStatus({
  completedEntryCount,
  errorMessage,
  hasUnsavedChanges,
  saveState,
  updatedAt,
}: {
  completedEntryCount: number;
  errorMessage: string | null;
  hasUnsavedChanges: boolean;
  saveState: SaveState;
  updatedAt: string | null;
}): TopbarSaveStatus {
  const badge = `${completedEntryCount} completed day${completedEntryCount === 1 ? "" : "s"}`;

  if (saveState === "error") {
    return {
      badge,
      body: errorMessage ?? "Saving hit a problem. Your reflection is still here.",
      label: "Save paused",
      tone: "danger",
    };
  }

  if (saveState === "saving") {
    return {
      badge,
      body: "Saving this week quietly in the background.",
      label: "Saving",
      tone: "primary",
    };
  }

  if (saveState === "saved") {
    return {
      badge,
      body: `Saved at ${formatUpdatedAt(updatedAt)}.`,
      label: "Saved",
      tone: "success",
    };
  }

  if (hasUnsavedChanges) {
    return {
      badge,
      body: "Changes save when you leave the field or page. A quiet 1-minute safeguard stays on.",
      label: "Unsaved changes",
      tone: "warning",
    };
  }

  return {
    badge,
    body: updatedAt
      ? `Last saved at ${formatUpdatedAt(updatedAt)}.`
      : "Changes save when you leave the field or page.",
    label: "Idle",
    tone: "muted",
  };
}

const longFieldContent: Record<
  LongFieldName,
  {
    description: string;
    eyebrow: string;
    placeholder: string;
    title: string;
  }
> = {
  feltOff: {
    description: "Notice what kept catching or dragging on you, without turning the page into a report.",
    eyebrow: "Felt off",
    placeholder: "Name the friction, the weirdness, or the part of the week that would not settle.",
    title: "What felt off?",
  },
  hardMoments: {
    description: "Capture the hard parts clearly enough to learn from them, but not harshly.",
    eyebrow: "Hard moments",
    placeholder: "Write the harder moments, the sharp edges, or the places you felt stretched thin.",
    title: "What felt hard?",
  },
  nextWeekIntention: {
    description: "Keep next week pointed in a gentle direction instead of turning it into a strict plan.",
    eyebrow: "Next week",
    placeholder: "Give next week one honest intention to return to.",
    title: "What do you want to carry into next week?",
  },
  summaryContext: {
    description: "Let the week speak in a few grounded paragraphs about mood, energy, and what shaped it.",
    eyebrow: "Weekly context",
    placeholder: "What did the week feel like overall? What shaped the energy and tone?",
    title: "How did this week feel overall?",
  },
  wins: {
    description: "Gather the wins, bright spots, and steadier moments that deserve not to get lost.",
    eyebrow: "Wins",
    placeholder: "Write the wins, steady moments, and good surprises you want to keep.",
    title: "What went well this week?",
  },
};

function excerptText(value: string, fallback: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.length <= 240) {
    return trimmed;
  }

  return `${trimmed.slice(0, 237)}...`;
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function WeeklyReflectionPage({ reflection }: WeeklyReflectionPageProps) {
  const { isNavigating, registerFlushHandler, setTopbarSaveStatus } = useJournalRuntime();
  const [draft, setDraft] = useState<WeeklyReflectionDraft>(() =>
    normalizeWeeklyReflectionDraft(reflection),
  );
  const [reflectionId, setReflectionId] = useState(reflection.reflectionId);
  const [updatedAt, setUpdatedAt] = useState(reflection.updatedAt);
  const [daySummaries, setDaySummaries] = useState(reflection.daySummaries);
  const [completedEntryCount, setCompletedEntryCount] = useState(
    reflection.completedEntryCount,
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<LongFieldName | null>(null);
  const [activeTextField, setActiveTextField] = useState<string | null>(null);

  const lastPersistedDraftRef = useRef(normalizeWeeklyReflectionDraft(reflection));
  const lastFailedDraftRef = useRef<WeeklyReflectionDraft | null>(null);
  const latestDraftRef = useRef(draft);
  const persistPromiseRef = useRef<Promise<boolean> | null>(null);
  const requestedSaveRef = useRef<{
    allowFailedSnapshotRetry: boolean;
    snapshot: WeeklyReflectionDraft;
  } | null>(null);

  const normalizedDraft = normalizeWeeklyReflectionDraft(draft);
  const hasUnsavedChanges = !weeklyDraftsMatch(normalizedDraft, lastPersistedDraftRef.current);
  const activeFieldContent = activeField ? longFieldContent[activeField] : null;

  useEffect(() => {
    if (isNavigating) {
      setActiveField(null);
      setActiveTextField(null);
    }
  }, [isNavigating]);

  useEffect(() => {
    if (
      saveState === "error" &&
      lastFailedDraftRef.current &&
      !weeklyDraftsMatch(normalizedDraft, lastFailedDraftRef.current)
    ) {
      lastFailedDraftRef.current = null;
      setErrorMessage(null);
      setSaveState("idle");
    }
  }, [normalizedDraft, saveState]);

  useEffect(() => {
    if (saveState === "saved" && hasUnsavedChanges) {
      setSaveState("idle");
    }
  }, [hasUnsavedChanges, saveState]);

  useEffect(() => {
    setTopbarSaveStatus(
      buildWeeklyTopbarSaveStatus({
        completedEntryCount,
        errorMessage,
        hasUnsavedChanges,
        saveState,
        updatedAt,
      }),
    );

    return () => {
      setTopbarSaveStatus(null);
    };
  }, [
    completedEntryCount,
    errorMessage,
    hasUnsavedChanges,
    saveState,
    setTopbarSaveStatus,
    updatedAt,
  ]);

  const saveNormalizedDraft = useCallback(
    (
      snapshot: WeeklyReflectionDraft,
      options: {
        allowFailedSnapshotRetry?: boolean;
      } = {},
    ) => {
      const normalizedSnapshot = normalizeWeeklyReflectionDraft(snapshot);

      if (weeklyDraftsMatch(normalizedSnapshot, lastPersistedDraftRef.current)) {
        return Promise.resolve(true);
      }

      requestedSaveRef.current = {
        allowFailedSnapshotRetry: options.allowFailedSnapshotRetry ?? false,
        snapshot: normalizedSnapshot,
      };

      const drainPendingSaves = async () => {
        if (persistPromiseRef.current) {
          return persistPromiseRef.current;
        }

        const persistPromise = (async () => {
          let didAllRequestedSavesSucceed = true;

          while (requestedSaveRef.current) {
            const request = requestedSaveRef.current;
            requestedSaveRef.current = null;

            if (weeklyDraftsMatch(request.snapshot, lastPersistedDraftRef.current)) {
              continue;
            }

            if (
              !request.allowFailedSnapshotRetry &&
              lastFailedDraftRef.current &&
              weeklyDraftsMatch(lastFailedDraftRef.current, request.snapshot)
            ) {
              didAllRequestedSavesSucceed = false;
              continue;
            }

            setSaveState("saving");

            try {
              const result = await saveWeeklyReflectionAction(request.snapshot);

              setReflectionId(result.reflectionId);
              setUpdatedAt(result.updatedAt);
              setCompletedEntryCount(result.completedEntryCount);
              setDaySummaries(result.daySummaries);
              setErrorMessage(null);
              lastPersistedDraftRef.current = request.snapshot;
              lastFailedDraftRef.current = null;

              const latestNormalizedDraft = normalizeWeeklyReflectionDraft(latestDraftRef.current);

              if (weeklyDraftsMatch(latestNormalizedDraft, request.snapshot)) {
                setSaveState(requestedSaveRef.current ? "saving" : "saved");
              } else if (!requestedSaveRef.current) {
                setSaveState("idle");
              }
            } catch (error) {
              const message = messageFromError(
                error,
                "Autosave hit a problem. Please try again.",
              );

              lastFailedDraftRef.current = request.snapshot;
              setErrorMessage(message);
              setSaveState("error");
              didAllRequestedSavesSucceed = false;
            }
          }

          return didAllRequestedSavesSucceed && requestedSaveRef.current === null;
        })();

        persistPromiseRef.current = persistPromise.finally(() => {
          persistPromiseRef.current = null;
          if (requestedSaveRef.current) {
            void drainPendingSaves();
          }
        });

        return persistPromiseRef.current;
      };

      return drainPendingSaves();
    },
    [],
  );

  useEffect(() => {
    if (!activeTextField) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const latestNormalizedDraft = normalizeWeeklyReflectionDraft(latestDraftRef.current);

      if (weeklyDraftsMatch(latestNormalizedDraft, lastPersistedDraftRef.current)) {
        return;
      }

      if (
        lastFailedDraftRef.current &&
        weeklyDraftsMatch(latestNormalizedDraft, lastFailedDraftRef.current)
      ) {
        return;
      }

      void saveNormalizedDraft(latestNormalizedDraft);
    }, SAVE_GUARD_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTextField, saveNormalizedDraft]);

  useEffect(() => {
    if (saveState !== "saved") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveState((currentState) => (currentState === "saved" ? "idle" : currentState));
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveState]);

  const updateDraft = useCallback(
    (updater: (currentDraft: WeeklyReflectionDraft) => WeeklyReflectionDraft) => {
      const nextDraft = updater(latestDraftRef.current);
      latestDraftRef.current = nextDraft;
      setDraft(nextDraft);
      return nextDraft;
    },
    [],
  );

  const commitLatestDraft = useCallback(() => {
    return saveNormalizedDraft(latestDraftRef.current);
  }, [saveNormalizedDraft]);

  const flushPendingChanges = useCallback(async () => {
    setActiveField(null);
    setActiveTextField(null);

    const latestNormalizedDraft = normalizeWeeklyReflectionDraft(latestDraftRef.current);

    if (!weeklyDraftsMatch(latestNormalizedDraft, lastPersistedDraftRef.current)) {
      if (
        lastFailedDraftRef.current &&
        weeklyDraftsMatch(latestNormalizedDraft, lastFailedDraftRef.current)
      ) {
        return false;
      }

      return saveNormalizedDraft(latestNormalizedDraft);
    }

    return persistPromiseRef.current ?? true;
  }, [saveNormalizedDraft]);

  useEffect(() => registerFlushHandler(flushPendingChanges), [
    flushPendingChanges,
    registerFlushHandler,
  ]);

  const setLongFieldValue = useCallback(
    (field: LongFieldName, value: string) => {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        [field]: value,
      }));
    },
    [updateDraft],
  );

  const commitFieldChange = useCallback(() => {
    setActiveTextField(null);
    void commitLatestDraft();
  }, [commitLatestDraft]);

  const setLifeAreaRating = useCallback((areaKey: WeeklyLifeAreaKey, rating: number) => {
    const nextDraft = updateDraft((currentDraft) => ({
      ...currentDraft,
      lifeAreaRatings: currentDraft.lifeAreaRatings.map((lifeArea) =>
        lifeArea.areaKey === areaKey
          ? {
              ...lifeArea,
              rating: lifeArea.rating === rating ? null : rating,
              note: lifeArea.rating === rating ? "" : lifeArea.note,
            }
          : lifeArea,
      ),
    }));
    void saveNormalizedDraft(nextDraft);
  }, [saveNormalizedDraft, updateDraft]);

  const setLifeAreaNote = useCallback((areaKey: WeeklyLifeAreaKey, note: string) => {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      lifeAreaRatings: currentDraft.lifeAreaRatings.map((lifeArea) =>
        lifeArea.areaKey === areaKey
          ? {
              ...lifeArea,
              note,
            }
          : lifeArea,
      ),
    }));
  }, [updateDraft]);

  return (
    <>
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]"
        data-testid="weekly-reflection-page"
      >
        <div className="space-y-6">
          <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,rgba(8,15,30,0.95),rgba(12,20,37,0.88))] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary/75">
                  Weekly reflection
                </p>
                <div className="space-y-3">
                  <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                    {reflection.weekLabel}
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {reflection.weekRangeLabel}. A calm place to notice the week before you carry
                    it forward.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {reflection.weekRangeLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {completedEntryCount} completed day{completedEntryCount === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <Heart className="h-4 w-4 text-primary" />
                    {reflectionId ? "Saved weekly reflection" : "Starts saving after the first real note"}
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] border border-border/60 bg-background/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                  Weekly rhythm
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Start with the mood the week actually had.</li>
                  <li>Rate the life areas without trying to make them perfect.</li>
                  <li>Write the bigger notes in the same spacious modal as the daily page.</li>
                  <li>Use the daily links below when one specific day needs a second look.</li>
                </ul>
              </div>
            </div>
          </Card>

          <EntrySection
            description="Choose the emotional headline for the week before the details start pulling too hard."
            eyebrow="Overall mood"
            title="How did this week feel?"
          >
            <MoodPicker
              onChange={(nextMood) => {
                const nextDraft = updateDraft((currentDraft) => ({
                  ...currentDraft,
                  overallMoodEmoji: nextMood.emoji,
                  overallMoodLabel: nextMood.label,
                  overallMoodValue: nextMood.value,
                }));
                void saveNormalizedDraft(nextDraft);
              }}
              value={draft.overallMoodValue}
            />
          </EntrySection>

          <EntrySection
            description="Use a sentence or two to capture the bigger weather of the week: mood, energy, and what seemed to shape both."
            eyebrow="Context"
            title="Weekly summary"
          >
            <Card className="rounded-[28px] border border-border/60 bg-ruled bg-[length:100%_38px] p-5 sm:p-6">
              <p className="whitespace-pre-wrap text-sm leading-8 text-foreground/90">
                {excerptText(
                  draft.summaryContext,
                  "Open the larger writing space to capture the tone, energy, and shape of the week.",
                )}
              </p>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button
                className="rounded-full"
                data-testid="open-weekly-summary"
                onClick={() => setActiveField("summaryContext")}
                type="button"
              >
                {draft.summaryContext.trim() ? "Open weekly summary" : "Start weekly summary"}
              </Button>
            </div>
          </EntrySection>

          <EntrySection
            description="Rate the major areas quickly. Notes stay short and only open up when a rating needs context."
            eyebrow="Life areas"
            title="How did the week land?"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {WEEKLY_LIFE_AREAS.map((area) => {
                const rating = draft.lifeAreaRatings.find(
                  (lifeArea) => lifeArea.areaKey === area.key,
                );

                if (!rating) {
                  return null;
                }

                return (
                  <Card className="space-y-4 p-5" key={area.key}>
                    <div>
                      <p className="font-medium text-foreground">{area.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Give it a quick 1-5 read without overthinking it.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          className={
                            rating.rating === value
                              ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/35 bg-primary/10 font-medium text-primary"
                              : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 font-medium text-foreground transition hover:border-primary/25 hover:bg-accent/20"
                          }
                          data-testid={`life-area-${area.key}-rating-${value}`}
                          key={value}
                          onClick={() => setLifeAreaRating(area.key, value)}
                          type="button"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <Input
                      data-testid={`life-area-${area.key}-note`}
                      disabled={rating.rating === null}
                      onBlur={commitFieldChange}
                      onChange={(event) => setLifeAreaNote(area.key, event.currentTarget.value)}
                      onFocus={() => setActiveTextField(`lifeAreaRatings.${area.key}.note`)}
                      placeholder={
                        rating.rating === null
                          ? "Pick a rating first to add a note."
                          : "Optional note"
                      }
                      value={rating.note}
                    />
                  </Card>
                );
              })}
            </div>
          </EntrySection>

          <EntrySection
            description="Keep the longer reflection pieces spacious and honest, just like the daily writing surface."
            eyebrow="Reflection"
            title="Notice what the week is saying"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {(
                [
                  ["wins", draft.wins, "Collect the wins, steady moments, and bright spots."],
                  ["hardMoments", draft.hardMoments, "Name the hard moments clearly and gently."],
                  ["feltOff", draft.feltOff, "Notice what kept pulling or scraping at the week."],
                  [
                    "nextWeekIntention",
                    draft.nextWeekIntention,
                    "Set one direction for next week, not a whole system.",
                  ],
                ] as Array<[LongFieldName, string, string]>
              ).map(([field, value, fallback]) => (
                <Card className="space-y-4 p-5" key={field}>
                  <div>
                    <p className="font-medium text-foreground">{longFieldContent[field].title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{fallback}</p>
                  </div>
                  <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                      {excerptText(value, fallback)}
                    </p>
                  </div>
                  <Button
                    className="rounded-full"
                    data-testid={`open-${field}`}
                    onClick={() => setActiveField(field)}
                    type="button"
                    variant="outline"
                  >
                    {value.trim() ? "Open writing space" : "Write here"}
                  </Button>
                </Card>
              ))}
            </div>
          </EntrySection>

          <EntrySection
            description="These daily links keep the weekly page grounded in the actual days instead of floating off into vague summary."
            eyebrow="This week"
            title="Quick links to the days"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {daySummaries.map((day) => (
                <GuardedLink href={`/entry/${day.entryDate}`} key={day.entryDate}>
                  <Card className="h-full p-5 transition hover:border-primary/30 hover:bg-accent/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {day.dayLabel}
                        </p>
                        <p className="text-sm text-muted-foreground">{day.entryDate}</p>
                      </div>
                      <span className="text-2xl">{day.moodEmoji ?? "·"}</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {day.hasEntry
                        ? day.moodLabel
                          ? `${day.moodLabel} with a ${day.status.replace("_", " ")} entry.`
                          : `A ${day.status.replace("_", " ")} entry with no mood selected.`
                        : "No daily entry yet for this day."}
                    </p>
                    {day.tagSlugs.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {day.tagSlugs.slice(0, 4).map((tagSlug) => (
                          <span
                            className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground"
                            key={tagSlug}
                          >
                            #{tagSlug}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Open day
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Card>
                </GuardedLink>
              ))}
            </div>
          </EntrySection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4 p-5">
            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Week mood
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {draft.overallMoodLabel
                  ? `${draft.overallMoodEmoji} ${draft.overallMoodLabel}`
                  : "No overall mood chosen yet."}
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Daily context
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {completedEntryCount > 0
                  ? `${completedEntryCount} daily entries are already giving this week some texture.`
                  : "The weekly page is ready even if only a few daily pages are filled in so far."}
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Carry forward
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {draft.nextWeekIntention.trim()
                  ? "You already have a direction to carry into next week."
                  : "A single intention is enough. This page does not need to become a planning system."}
              </p>
            </div>
          </Card>
        </aside>
      </main>

      <WritingModal
        dateLabel={reflection.weekRangeLabel}
        description={
          activeFieldContent
            ? `${reflection.weekLabel}. ${activeFieldContent.description}`
            : undefined
        }
        eyebrow={activeFieldContent?.eyebrow}
        onChange={(value) => {
          if (activeField) {
            setLongFieldValue(activeField, value);
          }
        }}
        onClose={() => {
          setActiveField(null);
          setActiveTextField(null);
          void commitLatestDraft();
        }}
        onTextareaBlur={commitFieldChange}
        onTextareaFocus={() => {
          if (activeField) {
            setActiveTextField(activeField);
          }
        }}
        open={activeField !== null}
        placeholder={activeFieldContent?.placeholder}
        testId={activeField ? `weekly-${activeField}-textarea` : "weekly-writing-textarea"}
        title={activeFieldContent?.title}
        value={activeField ? draft[activeField] : ""}
      />
    </>
  );
}
