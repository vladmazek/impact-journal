import { normalizeManualTagSlugs } from "@/lib/journal/tags";

export const DAILY_MOODS = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "tired", emoji: "😮‍💨", label: "Tired" },
  { value: "stressed", emoji: "😣", label: "Stressed" },
  { value: "low", emoji: "😔", label: "Low" },
  { value: "overwhelmed", emoji: "😤", label: "Angry" },
] as const;

export type DailyEntryStatus = "not_started" | "in_progress" | "completed";

export type ImageAttachmentRecord = {
  byteSize: number;
  extension: string;
  height: number | null;
  id: string;
  mimeType: string;
  originalFilename: string;
  relativePath: string;
  sortOrder: number;
  storedFilename: string;
  width: number | null;
};

export type TagRecord = {
  id: string;
  isManual: boolean;
  name: string;
  slug: string;
};

export type TagSuggestionRecord = {
  id: string;
  name: string;
  slug: string;
};

export type DailyEntryDraft = {
  affirmation: string;
  dailyCapture: string;
  entryDate: string;
  eveningGood1: string;
  eveningGood2: string;
  eveningGood3: string;
  gratitude1: string;
  gratitude2: string;
  gratitude3: string;
  improveTomorrow: string;
  moodEmoji: string | null;
  moodLabel: string | null;
  moodValue: string | null;
  manualTagSlugs: string[];
  relaxItems: string[];
  todayGreat: string;
};

type DailyEntryParsedTagSource = Pick<
  DailyEntryDraft,
  | "affirmation"
  | "dailyCapture"
  | "eveningGood1"
  | "eveningGood2"
  | "eveningGood3"
  | "gratitude1"
  | "gratitude2"
  | "gratitude3"
  | "improveTomorrow"
  | "todayGreat"
>;

export type DailyEntryRecord = DailyEntryDraft & {
  entryId: string | null;
  exists: boolean;
  imageAttachments: ImageAttachmentRecord[];
  status: DailyEntryStatus;
  tagSuggestions: TagSuggestionRecord[];
  tags: TagRecord[];
  updatedAt: string | null;
};

export type DailyEntrySaveResult = {
  entryId: string | null;
  imageAttachments?: ImageAttachmentRecord[];
  relaxItems: string[];
  status: DailyEntryStatus;
  tagSuggestions: TagSuggestionRecord[];
  tags: TagRecord[];
  updatedAt: string | null;
};

type DailyEntryContentOptions = {
  imageCount?: number;
  tagCount?: number;
};

type PartialDraftInput = Partial<DailyEntryDraft> & {
  entryDate: string;
  relaxItems?: string[] | null;
};

export function createEmptyDailyEntry(entryDate: string): DailyEntryRecord {
  return {
    affirmation: "",
    dailyCapture: "",
    entryDate,
    entryId: null,
    eveningGood1: "",
    eveningGood2: "",
    eveningGood3: "",
    exists: false,
    gratitude1: "",
    gratitude2: "",
    gratitude3: "",
    imageAttachments: [],
    improveTomorrow: "",
    manualTagSlugs: [],
    moodEmoji: null,
    moodLabel: null,
    moodValue: null,
    relaxItems: [],
    status: "not_started",
    tagSuggestions: [],
    tags: [],
    todayGreat: "",
    updatedAt: null,
  };
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function normalizeMoodValue(value: string | null | undefined) {
  const normalizedValue = normalizeText(value);
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function normalizeDailyEntryDraft(
  draft: PartialDraftInput | DailyEntryDraft,
): DailyEntryDraft {
  return {
    affirmation: normalizeText(draft.affirmation),
    dailyCapture: normalizeText(draft.dailyCapture),
    entryDate: draft.entryDate,
    eveningGood1: normalizeText(draft.eveningGood1),
    eveningGood2: normalizeText(draft.eveningGood2),
    eveningGood3: normalizeText(draft.eveningGood3),
    gratitude1: normalizeText(draft.gratitude1),
    gratitude2: normalizeText(draft.gratitude2),
    gratitude3: normalizeText(draft.gratitude3),
    improveTomorrow: normalizeText(draft.improveTomorrow),
    manualTagSlugs: normalizeManualTagSlugs(draft.manualTagSlugs),
    moodEmoji: normalizeMoodValue(draft.moodEmoji),
    moodLabel: normalizeMoodValue(draft.moodLabel),
    moodValue: normalizeMoodValue(draft.moodValue),
    relaxItems: (draft.relaxItems ?? [])
      .map((item) => normalizeText(item))
      .filter((item) => item.length > 0)
      .slice(0, 5),
    todayGreat: normalizeText(draft.todayGreat),
  };
}

export function hasMeaningfulDailyEntryContent(
  draft: DailyEntryDraft,
  options: DailyEntryContentOptions = {},
) {
  const imageCount = options.imageCount ?? 0;
  const tagCount = options.tagCount ?? 0;

  return Boolean(
    draft.gratitude1 ||
      draft.gratitude2 ||
      draft.gratitude3 ||
      draft.todayGreat ||
      draft.affirmation ||
      draft.dailyCapture ||
      draft.eveningGood1 ||
      draft.eveningGood2 ||
      draft.eveningGood3 ||
      draft.improveTomorrow ||
      draft.relaxItems.length > 0 ||
      imageCount > 0 ||
      tagCount > 0,
  );
}

export function inferDailyEntryStatus(
  draft: DailyEntryDraft,
  options: DailyEntryContentOptions = {},
): DailyEntryStatus {
  const hasMood = Boolean(draft.moodValue);
  const hasMeaningfulText = hasMeaningfulDailyEntryContent(draft, options);

  if (!hasMood && !hasMeaningfulText) {
    return "not_started";
  }

  if (hasMood && hasMeaningfulText) {
    return "completed";
  }

  return "in_progress";
}

export function buildDailyEntryParsedTagSourceText(draft: DailyEntryParsedTagSource) {
  return [
    draft.gratitude1,
    draft.gratitude2,
    draft.gratitude3,
    draft.todayGreat,
    draft.affirmation,
    draft.dailyCapture,
    draft.eveningGood1,
    draft.eveningGood2,
    draft.eveningGood3,
    draft.improveTomorrow,
  ]
    .filter((value) => value.length > 0)
    .join("\n");
}

export function isDailyEntryEffectivelyEmpty(
  draft: DailyEntryDraft,
  options: DailyEntryContentOptions = {},
) {
  return !draft.moodValue && !hasMeaningfulDailyEntryContent(draft, options);
}

export function draftsMatch(left: DailyEntryDraft, right: DailyEntryDraft) {
  return JSON.stringify(left) === JSON.stringify(right);
}
