"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  Expand,
  ImagePlus,
  LampDesk,
  Trash2,
} from "lucide-react";

import { saveDailyEntryAction } from "@/lib/actions/daily-entry";
import {
  deleteEntryImageAction,
  uploadEntryImagesAction,
} from "@/lib/actions/image-attachments";
import {
  buildDailyEntryParsedTagSourceText,
  draftsMatch,
  inferDailyEntryStatus,
  normalizeDailyEntryDraft,
  type DailyEntryDraft,
  type DailyEntryRecord,
  type ImageAttachmentRecord,
  type TagRecord,
  type TagSuggestionRecord,
} from "@/lib/journal/daily-entry-shared";
import { buildNormalizedTag, extractTagsFromText, formatTagLabel } from "@/lib/journal/tags";
import {
  formatLongDateFromSlug,
  resolveDailyPromptSection,
} from "@/lib/date";
import { getMediaUrl } from "@/lib/media-url";
import { type CalendarNavigationMonth } from "@/lib/journal/calendar-navigation";
import { DateNavigation } from "@/components/journal/date-navigation";
import { EntrySection } from "@/components/journal/entry-section";
import { EveningSceneIllustration } from "@/components/journal/evening-scene-illustration";
import { ImagePreviewModal } from "@/components/journal/image-preview-modal";
import { MorningSceneIllustration } from "@/components/journal/morning-scene-illustration";
import { MoodPicker } from "@/components/journal/mood-picker";
import { RelaxList } from "@/components/journal/relax-list";
import {
  type TopbarSaveStatus,
  useJournalRuntime,
} from "@/components/journal/journal-runtime";
import { WritingModal } from "@/components/journal/writing-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type MotivationalQuote } from "@/lib/motivational-quotes";
import { cn } from "@/lib/utils";

type JournalEntryPageProps = {
  calendarNavigation: CalendarNavigationMonth;
  entry: DailyEntryRecord;
  motivationalQuote: MotivationalQuote;
  preferredPromptSection: PromptSection;
  todayDate: string;
  userTimeZone: string;
};

type PromptSection = "evening" | "morning";
type PromptSectionVisibility = Record<PromptSection, boolean>;

type SaveState = "error" | "idle" | "saved" | "saving";
type TextFieldName =
  | "affirmation"
  | "dailyCapture"
  | "eveningGood1"
  | "eveningGood2"
  | "eveningGood3"
  | "gratitude1"
  | "gratitude2"
  | "gratitude3"
  | "improveTomorrow"
  | "todayGreat";

type VisibleTag = {
  id: string | null;
  isManual: boolean;
  isParsed: boolean;
  name: string;
  slug: string;
};

type PromptAccordionSectionProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  headerAside?: ReactNode;
  isOpen: boolean;
  onToggle: (section: PromptSection) => void;
  section: PromptSection;
  title: string;
};

type PromptFieldConfig = {
  field: TextFieldName;
  id: string;
  label: string;
  placeholder: string;
};

type PromptTextareaFieldProps = {
  eyebrow?: string;
  id: string;
  label: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  placeholder: string;
  value: string;
};

type PromptLineFieldProps = {
  id: string;
  label: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  placeholder: string;
  value: string;
};

const SAVE_GUARD_INTERVAL_MS = 60_000;

const MORNING_SHORT_FIELDS: PromptFieldConfig[] = [
  {
    field: "gratitude1",
    id: "gratitude1",
    label: "Gratitude one",
    placeholder: "Something quietly good",
  },
  {
    field: "gratitude2",
    id: "gratitude2",
    label: "Gratitude two",
    placeholder: "Another thing worth noticing",
  },
  {
    field: "gratitude3",
    id: "gratitude3",
    label: "Gratitude three",
    placeholder: "A person, place, or moment",
  },
];

const EVENING_SHORT_FIELDS: PromptFieldConfig[] = [
  {
    field: "eveningGood1",
    id: "eveningGood1",
    label: "Good thing one",
    placeholder: "A win, kindness, or bright spot",
  },
  {
    field: "eveningGood2",
    id: "eveningGood2",
    label: "Good thing two",
    placeholder: "Another thing worth holding onto",
  },
  {
    field: "eveningGood3",
    id: "eveningGood3",
    label: "Good thing three",
    placeholder: "A quiet detail that mattered",
  },
];

function CardPromptLineField({
  id,
  label,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  value,
}: PromptLineFieldProps) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <Label className="sr-only" htmlFor={id}>
        {label}
      </Label>
      <Input
        aria-label={label}
        className="h-auto border-0 bg-transparent px-0 py-0 text-[15px] leading-7 shadow-none placeholder:text-muted-foreground/85 focus-visible:ring-0"
        id={id}
        onBlur={onBlur}
        onChange={(event) => onChange(event.currentTarget.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function CardPromptTextareaField({
  eyebrow,
  id,
  label,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  value,
}: PromptTextareaFieldProps) {
  const hasEyebrow = Boolean(eyebrow);

  return (
    <div className="rounded-[30px] border border-border/60 bg-background/55 p-5">
      <div className={cn("space-y-2", hasEyebrow ? "" : "space-y-1")}>
        {hasEyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/65">{eyebrow}</p>
        ) : null}
        <p className="text-lg font-medium leading-7 text-foreground">{label}</p>
      </div>
      <div className={cn("border-t border-border/50", hasEyebrow ? "mt-4 pt-4" : "mt-3 pt-3")}>
        <Label className="sr-only" htmlFor={id}>
          {label}
        </Label>
        <Textarea
          aria-label={label}
          className={cn(
            "border-0 bg-transparent px-0 py-0 text-[15px] leading-7 shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-0",
            hasEyebrow ? "min-h-[122px]" : "min-h-[148px]",
          )}
          id={id}
          onBlur={onBlur}
          onChange={(event) => onChange(event.currentTarget.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          value={value}
        />
      </div>
    </div>
  );
}

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) {
    return "Nothing saved yet.";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

function buildDailyTopbarSaveStatus({
  errorMessage,
  hasUnsavedChanges,
  saveState,
  status,
  updatedAt,
}: {
  errorMessage: string | null;
  hasUnsavedChanges: boolean;
  saveState: SaveState;
  status: DailyEntryRecord["status"];
  updatedAt: string | null;
}): TopbarSaveStatus {
  const badge =
    status === "completed" ? "Completed" : status === "in_progress" ? "In progress" : "Not started";

  if (saveState === "error") {
    return {
      badge,
      body: errorMessage ?? "Saving hit a problem. Your draft is still here.",
      label: "Save paused",
      tone: "danger",
    };
  }

  if (saveState === "saving") {
    return {
      badge,
      body: "Saving your page quietly in the background.",
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

function excerptFromCapture(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Open the larger writing space when the day needs more room than a small field can offer.";
  }

  if (trimmed.length <= 280) {
    return trimmed;
  }

  return `${trimmed.slice(0, 277)}...`;
}

function readingTimeLabel(value: string) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount === 0) {
    return "Empty page";
  }

  if (wordCount < 140) {
    return `${wordCount} words`;
  }

  return `${Math.max(1, Math.round(wordCount / 180))} min read`;
}

function buildPromptSectionVisibilityForToday(
  activeSection: PromptSection | null,
): PromptSectionVisibility {
  return {
    evening: activeSection === "evening",
    morning: activeSection === "morning",
  };
}

function buildPromptSectionVisibility(options: {
  isToday: boolean;
  preferredPromptSection: PromptSection;
}): PromptSectionVisibility {
  if (!options.isToday) {
    return {
      evening: true,
      morning: true,
    };
  }

  return buildPromptSectionVisibilityForToday(options.preferredPromptSection);
}

function entryToDraft(entry: DailyEntryRecord): DailyEntryDraft {
  return {
    affirmation: entry.affirmation,
    dailyCapture: entry.dailyCapture,
    entryDate: entry.entryDate,
    eveningGood1: entry.eveningGood1,
    eveningGood2: entry.eveningGood2,
    eveningGood3: entry.eveningGood3,
    gratitude1: entry.gratitude1,
    gratitude2: entry.gratitude2,
    gratitude3: entry.gratitude3,
    improveTomorrow: entry.improveTomorrow,
    manualTagSlugs: entry.manualTagSlugs,
    moodEmoji: entry.moodEmoji,
    moodLabel: entry.moodLabel,
    moodValue: entry.moodValue,
    relaxItems: entry.relaxItems.length > 0 ? entry.relaxItems : [""],
    todayGreat: entry.todayGreat,
  };
}

function normalizeVisibleRelaxItems(items: string[]) {
  return items.length > 0 ? items : [""];
}

function formatBytes(byteSize: number) {
  if (byteSize < 1024) {
    return `${byteSize} B`;
  }

  if (byteSize < 1024 * 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`;
  }

  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sortVisibleTags(left: VisibleTag, right: VisibleTag) {
  if (left.isManual !== right.isManual) {
    return left.isManual ? -1 : 1;
  }

  return left.slug.localeCompare(right.slug);
}

function buildVisibleTags(options: {
  manualTagSlugs: string[];
  parsedTags: Array<{ name: string; slug: string }>;
  persistedTags: TagRecord[];
  tagSuggestions: TagSuggestionRecord[];
}) {
  const visibleTags = new Map<string, VisibleTag>();

  for (const tag of options.tagSuggestions) {
    visibleTags.set(tag.slug, {
      id: tag.id,
      isManual: false,
      isParsed: false,
      name: tag.name,
      slug: tag.slug,
    });
  }

  for (const tag of options.persistedTags) {
    visibleTags.set(tag.slug, {
      id: tag.id,
      isManual: tag.isManual,
      isParsed: false,
      name: tag.name,
      slug: tag.slug,
    });
  }

  for (const tag of options.parsedTags) {
    const existingTag = visibleTags.get(tag.slug);

    visibleTags.set(tag.slug, {
      id: existingTag?.id ?? null,
      isManual: existingTag?.isManual ?? false,
      isParsed: true,
      name: existingTag?.name ?? tag.name,
      slug: tag.slug,
    });
  }

  for (const slug of options.manualTagSlugs) {
    const existingTag = visibleTags.get(slug);

    visibleTags.set(slug, {
      id: existingTag?.id ?? null,
      isManual: true,
      isParsed: existingTag?.isParsed ?? false,
      name: existingTag?.name ?? slug,
      slug,
    });
  }

  return Array.from(visibleTags.values()).sort(sortVisibleTags);
}

function PromptAccordionSection({
  children,
  description,
  eyebrow,
  headerAside,
  isOpen,
  onToggle,
  section,
  title,
}: PromptAccordionSectionProps) {
  const contentId = `${section}-prompt-content`;

  return (
    <Card
      className="overflow-hidden border-border/60 bg-card/85"
      data-testid={`${section}-accordion-section`}
    >
      <button
        aria-controls={contentId}
        aria-expanded={isOpen}
        className="w-full px-6 py-5 text-left transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset sm:px-8 sm:py-6"
        data-testid={`${section}-accordion-trigger`}
        onClick={() => onToggle(section)}
        type="button"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-6">
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">{eyebrow}</p>
              <div className="space-y-2.5">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-[2.25rem] sm:leading-tight">
                  {title}
                </h2>
                {isOpen ? (
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-[1.05rem]">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            {isOpen && headerAside ? (
              <div className="shrink-0 self-start pt-0.5" data-testid={`${section}-header-aside`}>
                {headerAside}
              </div>
            ) : null}
          </div>
          <span
            className={cn(
              "mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition",
              isOpen ? "border-primary/30 text-primary" : "hover:border-primary/25",
            )}
          >
            <ChevronDown
              className={cn("h-5 w-5 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
            />
          </span>
        </div>
      </button>

      <div
        className={cn(
          "border-t border-border/50 p-6 pt-5 sm:p-8 sm:pt-5",
          !isOpen && "hidden",
        )}
        data-testid={`${section}-accordion-content`}
        hidden={!isOpen}
        id={contentId}
      >
        {children}
      </div>
    </Card>
  );
}

export function JournalEntryPage({
  calendarNavigation,
  entry,
  motivationalQuote,
  preferredPromptSection,
  todayDate,
  userTimeZone,
}: JournalEntryPageProps) {
  const { isNavigating, registerFlushHandler, setTopbarSaveStatus } = useJournalRuntime();
  const isToday = entry.entryDate === todayDate;

  const [draft, setDraft] = useState<DailyEntryDraft>(() => entryToDraft(entry));
  const [updatedAt, setUpdatedAt] = useState(entry.updatedAt);
  const [imageAttachments, setImageAttachments] = useState(entry.imageAttachments);
  const [persistedTags, setPersistedTags] = useState(entry.tags);
  const [tagSuggestions, setTagSuggestions] = useState(entry.tagSuggestions);
  const [tagInput, setTagInput] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const [tagErrorMessage, setTagErrorMessage] = useState<string | null>(null);
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [isWritingOpen, setIsWritingOpen] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isMoodSectionVisible, setIsMoodSectionVisible] = useState(() => !entry.moodValue);
  const [promptSectionVisibility, setPromptSectionVisibility] =
    useState<PromptSectionVisibility>(() =>
      buildPromptSectionVisibility({
        isToday,
        preferredPromptSection,
      }),
    );
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageAttachmentRecord | null>(null);
  const [activeTextField, setActiveTextField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const moodSectionRef = useRef<HTMLDivElement | null>(null);
  const lastObservedPromptSectionRef = useRef<PromptSection>(preferredPromptSection);
  const lastPersistedDraftRef = useRef(normalizeDailyEntryDraft(entryToDraft(entry)));
  const lastFailedDraftRef = useRef<DailyEntryDraft | null>(null);
  const latestDraftRef = useRef(draft);
  const persistPromiseRef = useRef<Promise<boolean> | null>(null);
  const requestedSaveRef = useRef<{
    allowFailedSnapshotRetry: boolean;
    snapshot: DailyEntryDraft;
  } | null>(null);
  const imageTaskPromiseRef = useRef<Promise<boolean> | null>(null);

  const normalizedDraft = normalizeDailyEntryDraft(draft);
  const parsedTags = extractTagsFromText(buildDailyEntryParsedTagSourceText(normalizedDraft));
  const visibleTags = buildVisibleTags({
    manualTagSlugs: normalizedDraft.manualTagSlugs,
    parsedTags,
    persistedTags,
    tagSuggestions,
  });
  const selectedTags = visibleTags.filter((tag) => tag.isManual || tag.isParsed);
  const inferredStatus = inferDailyEntryStatus(normalizedDraft, {
    imageCount: imageAttachments.length,
    tagCount: selectedTags.length,
  });
  const hasUnsavedChanges = !draftsMatch(normalizedDraft, lastPersistedDraftRef.current);
  const captureExcerpt = excerptFromCapture(draft.dailyCapture);
  const dateLabel = formatLongDateFromSlug(entry.entryDate);
  const hasSelectedMood = Boolean(draft.moodValue && draft.moodEmoji && draft.moodLabel);

  useEffect(() => {
    if (isNavigating) {
      setIsWritingOpen(false);
      setPreviewImage(null);
    }
  }, [isNavigating]);

  useEffect(() => {
    if (!previewImage) {
      return;
    }

    const nextPreviewImage =
      imageAttachments.find((image) => image.id === previewImage.id) ?? null;
    setPreviewImage(nextPreviewImage);
  }, [imageAttachments, previewImage]);

  useEffect(() => {
    setIsMoodSectionVisible(!entry.moodValue);
  }, [entry.entryDate, entry.moodValue]);

  useEffect(() => {
    if (!draft.moodValue) {
      setIsMoodSectionVisible(true);
    }
  }, [draft.moodValue]);

  useEffect(() => {
    lastObservedPromptSectionRef.current = preferredPromptSection;
    setPromptSectionVisibility(
      buildPromptSectionVisibility({
        isToday,
        preferredPromptSection,
      }),
    );
  }, [entry.entryDate, isToday, preferredPromptSection]);

  useEffect(() => {
    if (!isToday) {
      return;
    }

    const syncPromptSectionWithCurrentTime = () => {
      const nextPromptSection = resolveDailyPromptSection(new Date(), userTimeZone);

      if (nextPromptSection !== lastObservedPromptSectionRef.current) {
        lastObservedPromptSectionRef.current = nextPromptSection;
        setPromptSectionVisibility(buildPromptSectionVisibilityForToday(nextPromptSection));
      }
    };

    syncPromptSectionWithCurrentTime();

    const intervalId = window.setInterval(syncPromptSectionWithCurrentTime, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isToday, userTimeZone]);

  useEffect(() => {
    if (
      saveState === "error" &&
      lastFailedDraftRef.current &&
      !draftsMatch(normalizedDraft, lastFailedDraftRef.current)
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
      buildDailyTopbarSaveStatus({
        errorMessage,
        hasUnsavedChanges,
        saveState,
        status: inferredStatus,
        updatedAt,
      }),
    );

    return () => {
      setTopbarSaveStatus(null);
    };
  }, [
    errorMessage,
    hasUnsavedChanges,
    inferredStatus,
    saveState,
    setTopbarSaveStatus,
    updatedAt,
  ]);

  const saveNormalizedDraft = useCallback(
    (
      snapshot: DailyEntryDraft,
      options: {
        allowFailedSnapshotRetry?: boolean;
      } = {},
    ) => {
      const normalizedSnapshot = normalizeDailyEntryDraft(snapshot);

      if (draftsMatch(normalizedSnapshot, lastPersistedDraftRef.current)) {
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

            if (draftsMatch(request.snapshot, lastPersistedDraftRef.current)) {
              continue;
            }

            if (
              !request.allowFailedSnapshotRetry &&
              lastFailedDraftRef.current &&
              draftsMatch(lastFailedDraftRef.current, request.snapshot)
            ) {
              didAllRequestedSavesSucceed = false;
              continue;
            }

            setSaveState("saving");

            try {
              const result = await saveDailyEntryAction(request.snapshot);
              const savedSnapshot = {
                ...request.snapshot,
                manualTagSlugs: result.tags
                  .filter((tag) => tag.isManual)
                  .map((tag) => tag.slug),
                relaxItems: result.relaxItems,
              };

              setUpdatedAt(result.updatedAt);
              setPersistedTags(result.tags);
              setTagSuggestions(result.tagSuggestions);
              setTagErrorMessage(null);
              setErrorMessage(null);
              lastPersistedDraftRef.current = savedSnapshot;
              lastFailedDraftRef.current = null;

              const latestNormalizedDraft = normalizeDailyEntryDraft(latestDraftRef.current);

              if (draftsMatch(latestNormalizedDraft, request.snapshot)) {
                const syncedDraft = {
                  ...latestDraftRef.current,
                  manualTagSlugs: savedSnapshot.manualTagSlugs,
                  relaxItems: normalizeVisibleRelaxItems(savedSnapshot.relaxItems),
                };

                latestDraftRef.current = syncedDraft;
                setDraft(syncedDraft);
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
      const latestNormalizedDraft = normalizeDailyEntryDraft(latestDraftRef.current);

      if (draftsMatch(latestNormalizedDraft, lastPersistedDraftRef.current)) {
        return;
      }

      if (
        lastFailedDraftRef.current &&
        draftsMatch(latestNormalizedDraft, lastFailedDraftRef.current)
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

  const runImageTask = useCallback(async (task: () => Promise<boolean>) => {
    const imageTaskPromise = task().finally(() => {
      if (imageTaskPromiseRef.current === imageTaskPromise) {
        imageTaskPromiseRef.current = null;
      }
    });

    imageTaskPromiseRef.current = imageTaskPromise;
    return imageTaskPromise;
  }, []);

  const flushPendingChanges = useCallback(async () => {
    setIsWritingOpen(false);
    setActiveTextField(null);
    setPreviewImage(null);

    if (imageTaskPromiseRef.current) {
      const imageTaskSucceeded = await imageTaskPromiseRef.current;

      if (!imageTaskSucceeded) {
        return false;
      }
    }

    const latestNormalizedDraft = normalizeDailyEntryDraft(latestDraftRef.current);

    if (!draftsMatch(latestNormalizedDraft, lastPersistedDraftRef.current)) {
      if (
        lastFailedDraftRef.current &&
        draftsMatch(latestNormalizedDraft, lastFailedDraftRef.current)
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

  const updateDraft = useCallback((updater: (currentDraft: DailyEntryDraft) => DailyEntryDraft) => {
    const nextDraft = updater(latestDraftRef.current);
    latestDraftRef.current = nextDraft;
    setDraft(nextDraft);
    return nextDraft;
  }, []);

  const commitLatestDraft = useCallback(() => {
    return saveNormalizedDraft(latestDraftRef.current);
  }, [saveNormalizedDraft]);

  const setFieldValue = useCallback(
    (field: TextFieldName, value: string) => {
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

  const toggleManualTag = useCallback((slug: string) => {
    setTagErrorMessage(null);
    const nextDraft = updateDraft((currentDraft) => {
      const hasTag = currentDraft.manualTagSlugs.includes(slug);

      return {
        ...currentDraft,
        manualTagSlugs: hasTag
          ? currentDraft.manualTagSlugs.filter((tagSlug) => tagSlug !== slug)
          : [...currentDraft.manualTagSlugs, slug],
      };
    });
    void saveNormalizedDraft(nextDraft);
  }, [saveNormalizedDraft, updateDraft]);

  const createManualTag = useCallback(() => {
    const normalizedTag = buildNormalizedTag(tagInput);

    if (!normalizedTag) {
      setTagErrorMessage("Add a short tag with letters or numbers.");
      return;
    }

    const currentDraft = latestDraftRef.current;

    if (currentDraft.manualTagSlugs.includes(normalizedTag.slug)) {
      setTagInput("");
      setTagErrorMessage(null);
      setIsTagInputVisible(false);
      return;
    }

    const nextDraft = updateDraft((draftToUpdate) => ({
      ...draftToUpdate,
      manualTagSlugs: [...draftToUpdate.manualTagSlugs, normalizedTag.slug],
    }));

    setTagInput("");
    setTagErrorMessage(null);
    setIsTagInputVisible(false);
    void saveNormalizedDraft(nextDraft);
  }, [saveNormalizedDraft, tagInput, updateDraft]);

  const uploadImages = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setImageErrorMessage(null);
      setIsUploadingImages(true);

      await runImageTask(async () => {
        try {
          const formData = new FormData();
          formData.set("entryDate", entry.entryDate);

          files.forEach((file) => {
            formData.append("images", file);
          });

          const result = await uploadEntryImagesAction(formData);
          setUpdatedAt(result.updatedAt);
          setImageAttachments(result.imageAttachments);
          return true;
        } catch (error) {
          setImageErrorMessage(
            messageFromError(error, "Those images could not be uploaded right now."),
          );
          return false;
        } finally {
          setIsUploadingImages(false);
        }
      });
    },
    [entry.entryDate, runImageTask],
  );

  const deleteImage = useCallback(
    async (attachmentId: string) => {
      setImageErrorMessage(null);
      setDeletingImageId(attachmentId);

      await runImageTask(async () => {
        try {
          const result = await deleteEntryImageAction({
            attachmentId,
            entryDate: entry.entryDate,
          });

          setUpdatedAt(result.updatedAt);
          setImageAttachments(result.imageAttachments);

          if (previewImage?.id === attachmentId) {
            setPreviewImage(null);
          }

          return true;
        } catch (error) {
          setImageErrorMessage(
            messageFromError(error, "That image could not be deleted right now."),
          );
          return false;
        } finally {
          setDeletingImageId((currentValue) =>
            currentValue === attachmentId ? null : currentValue,
          );
        }
      });
    },
    [entry.entryDate, previewImage?.id, runImageTask],
  );

  const openMoodSection = useCallback(() => {
    setIsMoodSectionVisible(true);

    window.requestAnimationFrame(() => {
      moodSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const togglePromptSection = useCallback(
    (section: PromptSection) => {
      setPromptSectionVisibility((currentVisibility) => {
        if (!isToday) {
          return {
            ...currentVisibility,
            [section]: !currentVisibility[section],
          };
        }

        if (currentVisibility[section]) {
          return buildPromptSectionVisibilityForToday(null);
        }

        return buildPromptSectionVisibilityForToday(section);
      });
    },
    [isToday],
  );

  return (
    <>
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]"
        data-testid="journal-entry-page"
      >
        <div className="space-y-6">
          <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,rgba(8,15,30,0.95),rgba(12,20,37,0.88))] sm:p-8">
            <figure className="max-w-4xl space-y-5 sm:space-y-6">
              <p
                className="text-[11px] uppercase tracking-[0.28em] text-primary/75"
                data-testid="entry-hero-author"
              >
                {motivationalQuote.author}
              </p>
              <blockquote
                className="font-serif text-2xl font-medium tracking-tight text-foreground dark:text-white sm:text-[2.25rem] sm:leading-tight"
                data-testid="entry-hero-quote"
              >
                &ldquo;{motivationalQuote.quote}&rdquo;
              </blockquote>
            </figure>
          </Card>

          <div data-testid="entry-mood-section" id="entry-mood-section" ref={moodSectionRef}>
            {isMoodSectionVisible || !hasSelectedMood ? (
              <div data-testid="entry-mood-picker-section">
                <EntrySection title="Mood">
                  <MoodPicker
                    onChange={(nextMood) => {
                      const nextDraft = updateDraft((currentDraft) => ({
                        ...currentDraft,
                        moodEmoji: nextMood.emoji,
                        moodLabel: nextMood.label,
                        moodValue: nextMood.value,
                      }));

                      setIsMoodSectionVisible(!nextMood.value);
                      void saveNormalizedDraft(nextDraft);
                    }}
                    value={draft.moodValue}
                  />
                </EntrySection>
              </div>
            ) : null}
          </div>

          <PromptAccordionSection
            description="A few small lines to orient the day before it gets noisy."
            eyebrow="Morning"
            headerAside={<MorningSceneIllustration />}
            isOpen={promptSectionVisibility.morning}
            onToggle={togglePromptSection}
            section="morning"
            title="Open the page gently"
          >
            <div className="space-y-5">
              <div className="space-y-5" data-testid="morning-prompt-form">
                <div className="rounded-[30px] border border-border/60 bg-background/55 p-4 sm:p-5">
                  <div className="mb-4 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">
                      Three gratitudes
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Three quick lines, nothing more.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[24px] border border-border/50 bg-background/85 divide-y divide-border/50">
                    {MORNING_SHORT_FIELDS.map((field) => (
                      <CardPromptLineField
                        id={field.id}
                        key={field.id}
                        label={field.label}
                        onBlur={commitFieldChange}
                        onChange={(value) => setFieldValue(field.field, value)}
                        onFocus={() => setActiveTextField(field.field)}
                        placeholder={field.placeholder}
                        value={draft[field.field]}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <CardPromptTextareaField
                    id="todayGreat"
                    label="What would make today great?"
                    onBlur={commitFieldChange}
                    onChange={(value) => setFieldValue("todayGreat", value)}
                    onFocus={() => setActiveTextField("todayGreat")}
                    placeholder="A simple win, a feeling, or a small intention."
                    value={draft.todayGreat}
                  />
                  <CardPromptTextareaField
                    id="affirmation"
                    label="Daily affirmation"
                    onBlur={commitFieldChange}
                    onChange={(value) => setFieldValue("affirmation", value)}
                    onFocus={() => setActiveTextField("affirmation")}
                    placeholder="A line you want to keep close today."
                    value={draft.affirmation}
                  />
                </div>
              </div>
            </div>
          </PromptAccordionSection>

          <EntrySection
            description="Keep a short list of things that help you unwind later, without turning it into a task manager."
            eyebrow="Reset list"
            title="To relax"
          >
            <RelaxList
              items={draft.relaxItems}
              onChange={(items) =>
                updateDraft((currentDraft) => ({
                  ...currentDraft,
                  relaxItems: items,
                }))
              }
              onCommit={(items) => {
                setActiveTextField(null);
                const nextDraft = updateDraft((currentDraft) => ({
                  ...currentDraft,
                  relaxItems: items,
                }));
                void saveNormalizedDraft(nextDraft);
              }}
              onFocusItem={(index) => setActiveTextField(`relaxItems.${index}`)}
            />
          </EntrySection>

          <EntrySection
            description="This is the larger writing space for anything that deserves more than a line or two."
            eyebrow="Daily capture"
            title="Free-form notes"
          >
            <div className="space-y-4">
              <div
                className="rounded-[28px] border border-border/60 bg-ruled bg-[length:100%_38px] p-5 sm:p-6"
                data-testid="daily-capture-preview"
              >
                <p className="whitespace-pre-wrap text-sm leading-8 text-foreground/90">
                  {captureExcerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LampDesk className="h-4 w-4 text-primary" />
                  {readingTimeLabel(draft.dailyCapture)}
                </div>
                <Button
                  className="rounded-full"
                  data-testid="open-writing-modal"
                  onClick={() => setIsWritingOpen(true)}
                  type="button"
                >
                  {draft.dailyCapture.trim() ? "Open writing space" : "Start writing"}
                </Button>
              </div>
            </div>
          </EntrySection>

          <PromptAccordionSection
            description="End with what went well and one calm note for tomorrow."
            eyebrow="Evening"
            headerAside={<EveningSceneIllustration />}
            isOpen={promptSectionVisibility.evening}
            onToggle={togglePromptSection}
            section="evening"
            title="Close the day"
          >
            <div className="space-y-5">
              <div className="space-y-5" data-testid="evening-prompt-form">
                <div className="rounded-[30px] border border-border/60 bg-background/55 p-4 sm:p-5">
                  <div className="mb-4 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">
                      Three good things
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Three quick details before the day closes.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[24px] border border-border/50 bg-background/85 divide-y divide-border/50">
                    {EVENING_SHORT_FIELDS.map((field) => (
                      <CardPromptLineField
                        id={field.id}
                        key={field.id}
                        label={field.label}
                        onBlur={commitFieldChange}
                        onChange={(value) => setFieldValue(field.field, value)}
                        onFocus={() => setActiveTextField(field.field)}
                        placeholder={field.placeholder}
                        value={draft[field.field]}
                      />
                    ))}
                  </div>
                </div>

                <CardPromptTextareaField
                  id="improveTomorrow"
                  label="How could today have gone better?"
                  onBlur={commitFieldChange}
                  onChange={(value) => setFieldValue("improveTomorrow", value)}
                  onFocus={() => setActiveTextField("improveTomorrow")}
                  placeholder="Keep it kind and specific. What would help tomorrow feel steadier?"
                  value={draft.improveTomorrow}
                />
              </div>
            </div>
          </PromptAccordionSection>

        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <DateNavigation
            calendar={calendarNavigation}
            currentDate={entry.entryDate}
            todayDate={todayDate}
          />

          {hasSelectedMood ? (
            <Card className="space-y-4 p-5">
              <button
                aria-controls="entry-mood-section"
                aria-expanded={isMoodSectionVisible}
                className="flex w-full items-center gap-4 rounded-[22px] text-left transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                data-testid="mood-anchor-button"
                onClick={openMoodSection}
                type="button"
              >
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.32),rgba(59,130,246,0.16)_42%,rgba(59,130,246,0.08)_100%)] text-[1.9rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <span
                    aria-hidden="true"
                    className="translate-y-[1px] drop-shadow-[0_2px_10px_rgba(59,130,246,0.22)]"
                    role="img"
                  >
                    {draft.moodEmoji}
                  </span>
                </span>
                <div>
                  <p className="font-serif text-2xl leading-none text-foreground">
                    {draft.moodLabel}
                  </p>
                </div>
              </button>
            </Card>
          ) : null}

          <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
            <input
              accept="image/*,.heic,.heif"
              className="hidden"
              data-testid="image-upload-input"
              multiple
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = "";
                void uploadImages(files);
              }}
              ref={fileInputRef}
              type="file"
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">Images</p>
              <Button
                className="h-auto rounded-full px-3 py-1.5 text-xs font-medium"
                data-testid="image-upload-button"
                disabled={isUploadingImages || deletingImageId !== null}
                onClick={() => fileInputRef.current?.click()}
                type="button"
                variant="ghost"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {isUploadingImages ? "Uploading..." : "+ image"}
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {imageErrorMessage ? (
                <div
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
                  data-testid="image-error"
                >
                  {imageErrorMessage}
                </div>
              ) : null}

              {imageAttachments.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border/70 bg-background/70 px-5 py-8 text-center">
                  <Camera className="mx-auto h-8 w-8 text-primary/70" />
                  <p className="mt-3 text-sm font-medium text-foreground">No images yet</p>
                </div>
              ) : (
                <div className="grid gap-4" data-testid="image-gallery">
                  {imageAttachments.map((attachment) => {
                    const isDeleting = deletingImageId === attachment.id;

                    return (
                      <Card className="overflow-hidden p-0" key={attachment.id}>
                        <div className="group relative">
                          <button
                            className="block w-full text-left"
                            data-testid={`image-thumb-${attachment.id}`}
                            onClick={() => setPreviewImage(attachment)}
                            type="button"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={attachment.originalFilename}
                              className="h-52 w-full object-cover"
                              src={getMediaUrl(attachment.relativePath)}
                            />
                          </button>

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/85 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />

                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
                            <Button
                              className="pointer-events-auto rounded-full"
                              onClick={() => setPreviewImage(attachment)}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              <Expand className="h-4 w-4" />
                              Preview
                            </Button>
                            <Button
                              aria-label={`Delete ${attachment.originalFilename}`}
                              className="pointer-events-auto rounded-full border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
                              data-testid={`delete-image-${attachment.id}`}
                              disabled={isDeleting || isUploadingImages}
                              onClick={() => void deleteImage(attachment.id)}
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1 px-4 py-4">
                          <p className="truncate text-sm font-medium text-foreground">
                            {attachment.originalFilename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.width && attachment.height
                              ? `${attachment.width} × ${attachment.height}`
                              : "Dimensions unavailable"}
                            {" • "}
                            {formatBytes(attachment.byteSize)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {attachment.storedFilename}
                          </p>
                          {isDeleting ? (
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Deleting...
                            </p>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">Tags</p>
              <Button
                className="h-auto rounded-full px-3 py-1.5 text-xs font-medium"
                data-testid="open-tag-input"
                onClick={() => {
                  setTagErrorMessage(null);
                  setIsTagInputVisible(true);
                }}
                type="button"
                variant="ghost"
              >
                + tag
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="selected-tags">
                  {selectedTags.map((tag) => (
                    <button
                      className={
                        tag.isManual
                          ? "inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
                          : "inline-flex items-center rounded-full border border-dashed border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground"
                      }
                      data-testid={`selected-tag-${tag.slug}`}
                      key={tag.slug}
                      onClick={() => {
                        if (tag.isManual) {
                          toggleManualTag(tag.slug);
                        }
                      }}
                      type="button"
                    >
                      {formatTagLabel(tag.slug)}
                    </button>
                  ))}
                </div>
              ) : null}

              {isTagInputVisible ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createManualTag();
                  }}
                >
                  <Input
                    data-testid="tag-input"
                    onChange={(event) => setTagInput(event.currentTarget.value)}
                    placeholder="Add a tag"
                    value={tagInput}
                  />
                  <Button
                    className="rounded-full px-4"
                    data-testid="submit-tag-input"
                    type="submit"
                    variant="outline"
                  >
                    Add
                  </Button>
                </form>
              ) : null}

              {tagErrorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                  {tagErrorMessage}
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </main>

      <WritingModal
        dateLabel={dateLabel}
        onChange={(value) => setFieldValue("dailyCapture", value)}
        onClose={() => {
          setActiveTextField(null);
          setIsWritingOpen(false);
          void commitLatestDraft();
        }}
        onTextareaBlur={commitFieldChange}
        onTextareaFocus={() => setActiveTextField("dailyCapture")}
        open={isWritingOpen}
        value={draft.dailyCapture}
      />

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
