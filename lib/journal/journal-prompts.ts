import { z } from "zod";

export const JOURNAL_PROMPT_TITLE_MAX_LENGTH = 80;
export const JOURNAL_PROMPT_TEXT_MAX_LENGTH = 160;

const promptTitleSchema = z
  .string()
  .trim()
  .min(1, "Keep prompt titles short but present.")
  .max(JOURNAL_PROMPT_TITLE_MAX_LENGTH, `Keep prompt titles under ${JOURNAL_PROMPT_TITLE_MAX_LENGTH} characters.`);

const promptTextSchema = z
  .string()
  .trim()
  .min(1, "Keep prompt copy present.")
  .max(JOURNAL_PROMPT_TEXT_MAX_LENGTH, `Keep prompt copy under ${JOURNAL_PROMPT_TEXT_MAX_LENGTH} characters.`);

const promptSectionSchema = z.object({
  description: promptTextSchema,
  title: promptTitleSchema,
});

const promptCardSchema = z.object({
  placeholder: promptTextSchema,
  title: promptTitleSchema,
});

const promptListCardSchema = z.object({
  description: promptTextSchema,
  placeholders: z.tuple([promptTextSchema, promptTextSchema, promptTextSchema]),
  title: promptTitleSchema,
});

export const journalPromptConfigSchema = z.object({
  evening: z.object({
    goodThings: promptListCardSchema,
    improveTomorrow: promptCardSchema,
    section: promptSectionSchema,
  }),
  morning: z.object({
    affirmation: promptCardSchema,
    gratitudes: promptListCardSchema,
    section: promptSectionSchema,
    todayGreat: promptCardSchema,
  }),
});

export type JournalPromptConfig = z.infer<typeof journalPromptConfigSchema>;

function createDefaultJournalPromptConfig(): JournalPromptConfig {
  return {
    evening: {
      goodThings: {
        description: "Three quick details before the day closes.",
        placeholders: [
          "A win, kindness, or bright spot",
          "Another thing worth holding onto",
          "A quiet detail that mattered",
        ],
        title: "Three good things",
      },
      improveTomorrow: {
        placeholder: "Keep it kind and specific. What would help tomorrow feel steadier?",
        title: "How could today have gone better?",
      },
      section: {
        description: "End with what went well and one calm note for tomorrow.",
        title: "Close the day",
      },
    },
    morning: {
      affirmation: {
        placeholder: "A line you want to keep close today.",
        title: "Daily affirmation",
      },
      gratitudes: {
        description: "Three quick lines, nothing more.",
        placeholders: [
          "Something quietly good",
          "Another thing worth noticing",
          "A person, place, or moment",
        ],
        title: "Three gratitudes",
      },
      section: {
        description: "A few small lines to orient the day before it gets noisy.",
        title: "Open the page gently",
      },
      todayGreat: {
        placeholder: "A simple win, a feeling, or a small intention.",
        title: "What would make today great?",
      },
    },
  };
}

export const defaultJournalPromptConfig = createDefaultJournalPromptConfig();

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizePromptValue(
  value: unknown,
  fallback: string,
  maxLength: number,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0 || trimmedValue.length > maxLength) {
    return fallback;
  }

  return trimmedValue;
}

function normalizePromptTitle(value: unknown, fallback: string) {
  return normalizePromptValue(value, fallback, JOURNAL_PROMPT_TITLE_MAX_LENGTH);
}

function normalizePromptText(value: unknown, fallback: string) {
  return normalizePromptValue(value, fallback, JOURNAL_PROMPT_TEXT_MAX_LENGTH);
}

function normalizePromptListPlaceholders(
  value: unknown,
  fallback: [string, string, string],
): [string, string, string] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return [
    normalizePromptText(value[0], fallback[0]),
    normalizePromptText(value[1], fallback[1]),
    normalizePromptText(value[2], fallback[2]),
  ];
}

export function normalizeJournalPromptConfig(input: unknown): JournalPromptConfig {
  const parsedConfig = journalPromptConfigSchema.safeParse(input);

  if (parsedConfig.success) {
    return parsedConfig.data;
  }

  const fallback = createDefaultJournalPromptConfig();
  const root = asRecord(input);
  const morning = asRecord(root?.morning);
  const evening = asRecord(root?.evening);
  const morningSection = asRecord(morning?.section);
  const morningGratitudes = asRecord(morning?.gratitudes);
  const morningTodayGreat = asRecord(morning?.todayGreat);
  const morningAffirmation = asRecord(morning?.affirmation);
  const eveningSection = asRecord(evening?.section);
  const eveningGoodThings = asRecord(evening?.goodThings);
  const eveningImproveTomorrow = asRecord(evening?.improveTomorrow);

  return {
    evening: {
      goodThings: {
        description: normalizePromptText(
          eveningGoodThings?.description,
          fallback.evening.goodThings.description,
        ),
        placeholders: normalizePromptListPlaceholders(
          eveningGoodThings?.placeholders,
          fallback.evening.goodThings.placeholders,
        ),
        title: normalizePromptTitle(
          eveningGoodThings?.title,
          fallback.evening.goodThings.title,
        ),
      },
      improveTomorrow: {
        placeholder: normalizePromptText(
          eveningImproveTomorrow?.placeholder,
          fallback.evening.improveTomorrow.placeholder,
        ),
        title: normalizePromptTitle(
          eveningImproveTomorrow?.title,
          fallback.evening.improveTomorrow.title,
        ),
      },
      section: {
        description: normalizePromptText(
          eveningSection?.description,
          fallback.evening.section.description,
        ),
        title: normalizePromptTitle(eveningSection?.title, fallback.evening.section.title),
      },
    },
    morning: {
      affirmation: {
        placeholder: normalizePromptText(
          morningAffirmation?.placeholder,
          fallback.morning.affirmation.placeholder,
        ),
        title: normalizePromptTitle(
          morningAffirmation?.title,
          fallback.morning.affirmation.title,
        ),
      },
      gratitudes: {
        description: normalizePromptText(
          morningGratitudes?.description,
          fallback.morning.gratitudes.description,
        ),
        placeholders: normalizePromptListPlaceholders(
          morningGratitudes?.placeholders,
          fallback.morning.gratitudes.placeholders,
        ),
        title: normalizePromptTitle(
          morningGratitudes?.title,
          fallback.morning.gratitudes.title,
        ),
      },
      section: {
        description: normalizePromptText(
          morningSection?.description,
          fallback.morning.section.description,
        ),
        title: normalizePromptTitle(morningSection?.title, fallback.morning.section.title),
      },
      todayGreat: {
        placeholder: normalizePromptText(
          morningTodayGreat?.placeholder,
          fallback.morning.todayGreat.placeholder,
        ),
        title: normalizePromptTitle(
          morningTodayGreat?.title,
          fallback.morning.todayGreat.title,
        ),
      },
    },
  };
}

export function parseStoredJournalPromptConfig(serializedConfig: string | null | undefined) {
  if (!serializedConfig) {
    return createDefaultJournalPromptConfig();
  }

  try {
    return normalizeJournalPromptConfig(JSON.parse(serializedConfig));
  } catch {
    return createDefaultJournalPromptConfig();
  }
}

export function serializeJournalPromptConfig(config: unknown) {
  return JSON.stringify(normalizeJournalPromptConfig(config));
}
