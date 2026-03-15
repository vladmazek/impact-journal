"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  Camera,
  Expand,
  Hash,
  Heart,
  ImagePlus,
  LampDesk,
  MoonStar,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";

import { saveDailyEntryAction } from "@/lib/actions/daily-entry";
import {
  deleteEntryImageAction,
  uploadEntryImagesAction,
} from "@/lib/actions/image-attachments";
import {
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
  formatMonthDayFromSlug,
  formatRelativeEntryHeading,
} from "@/lib/date";
import { getMediaUrl } from "@/lib/media-url";
import { EntrySection } from "@/components/journal/entry-section";
import { ImagePreviewModal } from "@/components/journal/image-preview-modal";
import { MoodPicker } from "@/components/journal/mood-picker";
import { RelaxList } from "@/components/journal/relax-list";
import { SaveIndicator } from "@/components/journal/save-indicator";
import { useJournalRuntime } from "@/components/journal/journal-runtime";
import { WritingModal } from "@/components/journal/writing-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type JournalEntryPageProps = {
  entry: DailyEntryRecord;
  ownerName: string | null | undefined;
  todayDate: string;
};

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

export function JournalEntryPage({
  entry,
  ownerName,
  todayDate,
}: JournalEntryPageProps) {
  const { pendingDate, registerFlushHandler } = useJournalRuntime();

  const [draft, setDraft] = useState<DailyEntryDraft>(() => entryToDraft(entry));
  const [entryId, setEntryId] = useState(entry.entryId);
  const [updatedAt, setUpdatedAt] = useState(entry.updatedAt);
  const [imageAttachments, setImageAttachments] = useState(entry.imageAttachments);
  const [persistedTags, setPersistedTags] = useState(entry.tags);
  const [tagSuggestions, setTagSuggestions] = useState(entry.tagSuggestions);
  const [tagInput, setTagInput] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const [tagErrorMessage, setTagErrorMessage] = useState<string | null>(null);
  const [isWritingOpen, setIsWritingOpen] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageAttachmentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastPersistedDraftRef = useRef(normalizeDailyEntryDraft(entryToDraft(entry)));
  const inFlightDraftRef = useRef<DailyEntryDraft | null>(null);
  const lastFailedDraftRef = useRef<DailyEntryDraft | null>(null);
  const latestDraftRef = useRef(draft);
  const persistPromiseRef = useRef<Promise<boolean> | null>(null);
  const imageTaskPromiseRef = useRef<Promise<boolean> | null>(null);

  const normalizedDraft = normalizeDailyEntryDraft(draft);
  const parsedTags = extractTagsFromText(draft.dailyCapture);
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
  const relativeHeading = formatRelativeEntryHeading(entry.entryDate, todayDate);
  const isToday = entry.entryDate === todayDate;
  const captureExcerpt = excerptFromCapture(draft.dailyCapture);
  const dateLabel = formatLongDateFromSlug(entry.entryDate);
  const availableSuggestions = visibleTags.filter((tag) => !selectedTags.some((selectedTag) => selectedTag.slug === tag.slug));

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (pendingDate) {
      setIsWritingOpen(false);
      setPreviewImage(null);
    }
  }, [pendingDate]);

  useEffect(() => {
    if (!previewImage) {
      return;
    }

    const nextPreviewImage =
      imageAttachments.find((image) => image.id === previewImage.id) ?? null;
    setPreviewImage(nextPreviewImage);
  }, [imageAttachments, previewImage]);

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

  const saveNormalizedDraft = useCallback(
    async (
      snapshot: DailyEntryDraft,
      options: {
        allowFailedSnapshotRetry?: boolean;
      } = {},
    ) => {
      const normalizedSnapshot = normalizeDailyEntryDraft(snapshot);

      if (
        persistPromiseRef.current &&
        inFlightDraftRef.current &&
        draftsMatch(inFlightDraftRef.current, normalizedSnapshot)
      ) {
        return persistPromiseRef.current;
      }

      if (
        !options.allowFailedSnapshotRetry &&
        lastFailedDraftRef.current &&
        draftsMatch(lastFailedDraftRef.current, normalizedSnapshot)
      ) {
        return false;
      }

      setSaveState("saving");
      inFlightDraftRef.current = normalizedSnapshot;

      const persistPromise = (async () => {
        try {
          const result = await saveDailyEntryAction(normalizedSnapshot);
          const savedSnapshot = {
            ...normalizedSnapshot,
            manualTagSlugs: result.tags.filter((tag) => tag.isManual).map((tag) => tag.slug),
            relaxItems: result.relaxItems,
          };

          setEntryId(result.entryId);
          setUpdatedAt(result.updatedAt);
          setPersistedTags(result.tags);
          setTagSuggestions(result.tagSuggestions);
          setTagErrorMessage(null);
          setErrorMessage(null);
          lastPersistedDraftRef.current = savedSnapshot;
          lastFailedDraftRef.current = null;

          const latestNormalizedDraft = normalizeDailyEntryDraft(latestDraftRef.current);

          setDraft((currentDraft) => ({
            ...currentDraft,
            manualTagSlugs: savedSnapshot.manualTagSlugs,
            relaxItems: normalizeVisibleRelaxItems(savedSnapshot.relaxItems),
          }));

          if (draftsMatch(latestNormalizedDraft, savedSnapshot)) {
            setSaveState("saved");
          } else {
            setSaveState("idle");
          }

          return true;
        } catch (error) {
          const message = messageFromError(
            error,
            "Autosave hit a problem. Please try again.",
          );

          lastFailedDraftRef.current = normalizedSnapshot;
          setErrorMessage(message);
          setSaveState("error");
          return false;
        } finally {
          inFlightDraftRef.current = null;
          persistPromiseRef.current = null;
        }
      })();

      persistPromiseRef.current = persistPromise;
      return persistPromise;
    },
    [],
  );

  useEffect(() => {
    if (!hasUnsavedChanges || persistPromiseRef.current) {
      return;
    }

    if (lastFailedDraftRef.current && draftsMatch(normalizedDraft, lastFailedDraftRef.current)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveNormalizedDraft(normalizedDraft);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasUnsavedChanges, normalizedDraft, saveNormalizedDraft]);

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
    setPreviewImage(null);

    if (imageTaskPromiseRef.current) {
      const imageTaskSucceeded = await imageTaskPromiseRef.current;

      if (!imageTaskSucceeded) {
        return false;
      }
    }

    if (persistPromiseRef.current) {
      return persistPromiseRef.current;
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

    return true;
  }, [saveNormalizedDraft]);

  useEffect(() => registerFlushHandler(flushPendingChanges), [
    flushPendingChanges,
    registerFlushHandler,
  ]);

  const setFieldValue = useCallback((field: TextFieldName, value: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }, []);

  const toggleManualTag = useCallback((slug: string) => {
    setTagErrorMessage(null);
    setDraft((currentDraft) => {
      const hasTag = currentDraft.manualTagSlugs.includes(slug);

      return {
        ...currentDraft,
        manualTagSlugs: hasTag
          ? currentDraft.manualTagSlugs.filter((tagSlug) => tagSlug !== slug)
          : [...currentDraft.manualTagSlugs, slug],
      };
    });
  }, []);

  const createManualTag = useCallback(() => {
    const normalizedTag = buildNormalizedTag(tagInput);

    if (!normalizedTag) {
      setTagErrorMessage("Add a short tag with letters or numbers.");
      return;
    }

    setDraft((currentDraft) => {
      if (currentDraft.manualTagSlugs.includes(normalizedTag.slug)) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        manualTagSlugs: [...currentDraft.manualTagSlugs, normalizedTag.slug],
      };
    });
    setTagInput("");
    setTagErrorMessage(null);
  }, [tagInput]);

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
          setEntryId(result.entryId);
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

          setEntryId(result.entryId);
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

  return (
    <>
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]"
        data-testid="journal-entry-page"
      >
        <div className="space-y-6">
          <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,rgba(8,15,30,0.95),rgba(12,20,37,0.88))] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary/75">
                  {isToday ? "Today's page" : "Daily page"}
                </p>
                <div className="space-y-3">
                  <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                    {relativeHeading}
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {ownerName
                      ? `${ownerName}, keep this page light enough to use and honest enough to matter.`
                      : "Keep this page light enough to use and honest enough to matter."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {dateLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <BookOpenText className="h-4 w-4 text-primary" />
                    {entryId ? "Saved journal entry" : "Draft not created until first save"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <Camera className="h-4 w-4 text-primary" />
                    {imageAttachments.length === 1
                      ? "1 image attached"
                      : `${imageAttachments.length} images attached`}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <Tags className="h-4 w-4 text-primary" />
                    {selectedTags.length === 1 ? "1 tag in play" : `${selectedTags.length} tags in play`}
                  </span>
                </div>
                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        className={
                          tag.isManual
                            ? "inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                            : "inline-flex items-center gap-1 rounded-full border border-dashed border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                        }
                        key={tag.slug}
                      >
                        {!tag.isManual ? <Hash className="h-3 w-3" /> : null}
                        {formatTagLabel(tag.slug)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-border/60 bg-background/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                  Daily rhythm
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Start with the mood that feels true enough.</li>
                  <li>Use the morning prompts for traction, not perfection.</li>
                  <li>Open the writing space when the day needs more room.</li>
                  <li>Add photos when the page needs texture, not just words.</li>
                  <li>Let #tags stay lightweight enough to tap in or type in passing.</li>
                </ul>
              </div>
            </div>
          </Card>

          <EntrySection
            description="Choose the emotional headline first. One tap is enough, and tapping the same mood again clears it."
            eyebrow="Mood"
            title="How does today feel?"
          >
            <MoodPicker
              onChange={(nextMood) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  moodEmoji: nextMood.emoji,
                  moodLabel: nextMood.label,
                  moodValue: nextMood.value,
                }))
              }
              value={draft.moodValue}
            />
          </EntrySection>

          <EntrySection
            description="A few small lines to orient the day before it gets noisy."
            eyebrow="Morning"
            title="Open the page gently"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gratitude1">Gratitude one</Label>
                  <Input
                    id="gratitude1"
                    onChange={(event) => setFieldValue("gratitude1", event.currentTarget.value)}
                    placeholder="Something quietly good"
                    value={draft.gratitude1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gratitude2">Gratitude two</Label>
                  <Input
                    id="gratitude2"
                    onChange={(event) => setFieldValue("gratitude2", event.currentTarget.value)}
                    placeholder="Another thing worth noticing"
                    value={draft.gratitude2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gratitude3">Gratitude three</Label>
                  <Input
                    id="gratitude3"
                    onChange={(event) => setFieldValue("gratitude3", event.currentTarget.value)}
                    placeholder="A person, place, or moment"
                    value={draft.gratitude3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="todayGreat">What would make today great?</Label>
                  <Textarea
                    id="todayGreat"
                    onChange={(event) => setFieldValue("todayGreat", event.currentTarget.value)}
                    placeholder="A simple win, a feeling, or a small intention."
                    value={draft.todayGreat}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affirmation">Daily affirmation</Label>
                  <Textarea
                    id="affirmation"
                    onChange={(event) => setFieldValue("affirmation", event.currentTarget.value)}
                    placeholder="A line you want to keep close today."
                    value={draft.affirmation}
                  />
                </div>
              </div>
            </div>
          </EntrySection>

          <EntrySection
            description="Keep a short list of things that help you unwind later, without turning it into a task manager."
            eyebrow="Reset list"
            title="To relax"
          >
            <RelaxList
              items={draft.relaxItems}
              onChange={(items) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  relaxItems: items,
                }))
              }
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

          <EntrySection
            description="End with what went well and one calm note for tomorrow."
            eyebrow="Evening"
            title="Close the day"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eveningGood1">Good thing one</Label>
                  <Input
                    id="eveningGood1"
                    onChange={(event) => setFieldValue("eveningGood1", event.currentTarget.value)}
                    placeholder="A win, kindness, or bright spot"
                    value={draft.eveningGood1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eveningGood2">Good thing two</Label>
                  <Input
                    id="eveningGood2"
                    onChange={(event) => setFieldValue("eveningGood2", event.currentTarget.value)}
                    placeholder="Another thing worth holding onto"
                    value={draft.eveningGood2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eveningGood3">Good thing three</Label>
                  <Input
                    id="eveningGood3"
                    onChange={(event) => setFieldValue("eveningGood3", event.currentTarget.value)}
                    placeholder="A quiet detail that mattered"
                    value={draft.eveningGood3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="improveTomorrow">How could today have gone better?</Label>
                <Textarea
                  id="improveTomorrow"
                  onChange={(event) =>
                    setFieldValue("improveTomorrow", event.currentTarget.value)
                  }
                  placeholder="Keep it kind and specific. What would help tomorrow feel steadier?"
                  value={draft.improveTomorrow}
                />
              </div>
            </div>
          </EntrySection>

          <EntrySection
            description="Photos live on mounted disk storage. iPhone HEIC uploads are accepted when this Docker environment can process them reliably, and otherwise the app will ask for JPEG, PNG, or WEBP instead of failing mysteriously."
            eyebrow="Images"
            title="Attach what the day looked like"
          >
            <div className="space-y-4">
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

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="rounded-full"
                  data-testid="image-upload-button"
                  disabled={isUploadingImages || deletingImageId !== null}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <ImagePlus className="h-4 w-4" />
                  {isUploadingImages ? "Uploading..." : "Add images"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Stored under mounted media at `{entry.entryDate}` with original filenames kept in
                  metadata.
                </p>
              </div>

              {imageErrorMessage ? (
                <div
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
                  data-testid="image-error"
                >
                  {imageErrorMessage}
                </div>
              ) : null}

              {imageAttachments.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border/70 bg-background/70 px-6 py-10 text-center">
                  <Camera className="mx-auto h-10 w-10 text-primary/70" />
                  <p className="mt-4 font-medium text-foreground">No images attached yet</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add a few photos when the page needs a little more texture than words alone.
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  data-testid="image-gallery"
                >
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
          </EntrySection>

          <EntrySection
            description="Tap a remembered tag, add a new one, or let #hashtags from the writing space stay in sync automatically."
            eyebrow="Tags"
            title="Keep recall light"
          >
            <div className="space-y-4">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  createManualTag();
                }}
              >
                <Input
                  data-testid="tag-input"
                  onChange={(event) => setTagInput(event.currentTarget.value)}
                  placeholder="Add a tag like deep work or #family-time"
                  value={tagInput}
                />
                <Button className="rounded-full sm:min-w-[132px]" type="submit" variant="outline">
                  Add tag
                </Button>
              </form>

              {tagErrorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                  {tagErrorMessage}
                </div>
              ) : null}

              {selectedTags.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border/70 bg-background/70 px-6 py-10 text-center">
                  <Tags className="mx-auto h-10 w-10 text-primary/70" />
                  <p className="mt-4 font-medium text-foreground">No tags on this page yet</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Keep them lightweight. A tap or a `#tag` in the writing space is enough.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2" data-testid="selected-tags">
                    {selectedTags.map((tag) => (
                      <button
                        className={
                          tag.isManual
                            ? "inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
                            : "inline-flex items-center gap-2 rounded-full border border-dashed border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground"
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
                        {!tag.isManual ? <Hash className="h-3.5 w-3.5" /> : null}
                        {formatTagLabel(tag.slug)}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Filled tags stay pinned from the picker. Outlined tags are coming from the
                    `#hashtags` inside the writing space.
                  </p>
                </div>
              )}

              {availableSuggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
                    Recent tags
                  </p>
                  <div className="flex flex-wrap gap-2" data-testid="tag-suggestions">
                    {availableSuggestions.map((tag) => (
                      <button
                        className="rounded-full border border-border/70 bg-background/80 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-accent/20"
                        data-testid={`tag-suggestion-${tag.slug}`}
                        key={tag.slug}
                        onClick={() => toggleManualTag(tag.slug)}
                        type="button"
                      >
                        {formatTagLabel(tag.slug)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </EntrySection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SaveIndicator
            errorMessage={errorMessage}
            hasUnsavedChanges={hasUnsavedChanges}
            onRetry={() => {
              setErrorMessage(null);
              lastFailedDraftRef.current = null;
              void saveNormalizedDraft(normalizedDraft, {
                allowFailedSnapshotRetry: true,
              });
            }}
            saveState={saveState}
            status={inferredStatus}
            updatedAt={updatedAt}
          />

          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Heart className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Mood anchor</p>
                <p className="text-sm text-muted-foreground">
                  {draft.moodLabel ?? "No mood chosen yet"}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Writing room
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {draft.dailyCapture.trim()
                  ? "The longer writing space is carrying real texture already."
                  : "The page is still light. Use the writing space only when the smaller fields stop being enough."}
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Image cadence
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {imageAttachments.length > 0
                  ? `${imageAttachments.length} image${imageAttachments.length === 1 ? "" : "s"} attached for ${formatMonthDayFromSlug(entry.entryDate)}.`
                  : "No photos on this page yet. That is fine when the words are enough."}
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Tag memory
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {selectedTags.length > 0
                  ? `${selectedTags.length} tag${selectedTags.length === 1 ? "" : "s"} are helping this day stay easy to find again.`
                  : "No tags yet. Keep them light enough to add without breaking your writing rhythm."}
              </p>
              {selectedTags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTags.slice(0, 6).map((tag) => (
                    <span
                      className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground"
                      key={tag.slug}
                    >
                      {formatTagLabel(tag.slug)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Evening note
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {draft.eveningGood1 || draft.eveningGood2 || draft.eveningGood3
                  ? "You already have something worth closing the day around."
                  : "Three good things is enough. They do not need to be big to count."}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-[24px] border border-border/70 bg-background/75 px-4 py-3 text-sm text-muted-foreground">
              <MoonStar className="h-4 w-4 text-primary" />
              Private by default. One person, one journal, one honest page at a time.
            </div>
          </Card>
        </aside>
      </main>

      <WritingModal
        dateLabel={dateLabel}
        onChange={(value) => setFieldValue("dailyCapture", value)}
        onClose={() => setIsWritingOpen(false)}
        open={isWritingOpen}
        value={draft.dailyCapture}
      />

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
