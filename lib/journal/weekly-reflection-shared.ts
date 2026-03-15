import { DAILY_MOODS, type DailyEntryStatus } from "@/lib/journal/daily-entry-shared";

export { DAILY_MOODS as WEEKLY_MOODS };

export const WEEKLY_LIFE_AREAS = [
  { key: "work", label: "Work" },
  { key: "family_home", label: "Family / home" },
  { key: "health", label: "Health" },
  { key: "stress", label: "Stress" },
  { key: "personal_fulfillment", label: "Personal fulfillment" },
] as const;

export type WeeklyLifeAreaKey = (typeof WEEKLY_LIFE_AREAS)[number]["key"];

export type WeeklyLifeAreaRatingDraft = {
  areaKey: WeeklyLifeAreaKey;
  note: string;
  rating: number | null;
};

export type WeeklyDaySummary = {
  dayLabel: string;
  entryDate: string;
  hasEntry: boolean;
  moodEmoji: string | null;
  moodLabel: string | null;
  status: DailyEntryStatus;
  tagSlugs: string[];
};

export type WeeklyReflectionDraft = {
  feltOff: string;
  hardMoments: string;
  isoWeek: number;
  isoYear: number;
  lifeAreaRatings: WeeklyLifeAreaRatingDraft[];
  nextWeekIntention: string;
  overallMoodEmoji: string | null;
  overallMoodLabel: string | null;
  overallMoodValue: string | null;
  summaryContext: string;
  wins: string;
};

export type WeeklyReflectionRecord = WeeklyReflectionDraft & {
  completedEntryCount: number;
  daySummaries: WeeklyDaySummary[];
  exists: boolean;
  reflectionId: string | null;
  updatedAt: string | null;
  weekLabel: string;
  weekRangeLabel: string;
};

export type WeeklyReflectionSaveResult = {
  completedEntryCount: number;
  daySummaries: WeeklyDaySummary[];
  reflectionId: string | null;
  updatedAt: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function normalizeMoodValue(value: string | null | undefined) {
  const normalizedValue = normalizeText(value);
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeRating(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const clampedValue = Math.round(value);

  if (clampedValue < 1 || clampedValue > 5) {
    return null;
  }

  return clampedValue;
}

export function createEmptyWeeklyReflection(
  isoYear: number,
  isoWeek: number,
  options: Pick<
    WeeklyReflectionRecord,
    "completedEntryCount" | "daySummaries" | "weekLabel" | "weekRangeLabel"
  >,
): WeeklyReflectionRecord {
  return {
    completedEntryCount: options.completedEntryCount,
    daySummaries: options.daySummaries,
    exists: false,
    feltOff: "",
    hardMoments: "",
    isoWeek,
    isoYear,
    lifeAreaRatings: WEEKLY_LIFE_AREAS.map((area) => ({
      areaKey: area.key,
      note: "",
      rating: null,
    })),
    nextWeekIntention: "",
    overallMoodEmoji: null,
    overallMoodLabel: null,
    overallMoodValue: null,
    reflectionId: null,
    summaryContext: "",
    updatedAt: null,
    weekLabel: options.weekLabel,
    weekRangeLabel: options.weekRangeLabel,
    wins: "",
  };
}

export function normalizeWeeklyReflectionDraft(
  draft: Partial<WeeklyReflectionDraft> & {
    isoWeek: number;
    isoYear: number;
  },
): WeeklyReflectionDraft {
  const ratingsByArea = new Map(
    (draft.lifeAreaRatings ?? []).map((rating) => [rating.areaKey, rating]),
  );

  return {
    feltOff: normalizeText(draft.feltOff),
    hardMoments: normalizeText(draft.hardMoments),
    isoWeek: draft.isoWeek,
    isoYear: draft.isoYear,
    lifeAreaRatings: WEEKLY_LIFE_AREAS.map((area) => ({
      areaKey: area.key,
      note: normalizeText(ratingsByArea.get(area.key)?.note),
      rating: normalizeRating(ratingsByArea.get(area.key)?.rating),
    })),
    nextWeekIntention: normalizeText(draft.nextWeekIntention),
    overallMoodEmoji: normalizeMoodValue(draft.overallMoodEmoji),
    overallMoodLabel: normalizeMoodValue(draft.overallMoodLabel),
    overallMoodValue: normalizeMoodValue(draft.overallMoodValue),
    summaryContext: normalizeText(draft.summaryContext),
    wins: normalizeText(draft.wins),
  };
}

export function hasMeaningfulWeeklyReflectionContent(draft: WeeklyReflectionDraft) {
  return Boolean(
    draft.overallMoodValue ||
      draft.summaryContext ||
      draft.wins ||
      draft.hardMoments ||
      draft.feltOff ||
      draft.nextWeekIntention ||
      draft.lifeAreaRatings.some((rating) => rating.rating !== null || rating.note.length > 0),
  );
}

export function isWeeklyReflectionEffectivelyEmpty(draft: WeeklyReflectionDraft) {
  return !hasMeaningfulWeeklyReflectionContent(draft);
}

export function weeklyDraftsMatch(left: WeeklyReflectionDraft, right: WeeklyReflectionDraft) {
  return JSON.stringify(left) === JSON.stringify(right);
}
