import { describe, expect, it } from "vitest";

import {
  defaultJournalPromptConfig,
  normalizeJournalPromptConfig,
  parseStoredJournalPromptConfig,
  serializeJournalPromptConfig,
} from "@/lib/journal/journal-prompts";

describe("journal prompt config", () => {
  it("returns the shipped defaults when stored config is null", () => {
    expect(parseStoredJournalPromptConfig(null)).toEqual(defaultJournalPromptConfig);
  });

  it("falls back to defaults when stored config JSON is malformed", () => {
    expect(parseStoredJournalPromptConfig("{not-json")).toEqual(defaultJournalPromptConfig);
  });

  it("normalizes valid copy and falls back for missing or invalid fields", () => {
    expect(
      normalizeJournalPromptConfig({
        evening: {
          goodThings: {
            description: "",
            placeholders: [
              "  A calmer ending worth noting  ",
              null,
              "  A small thing I want to remember  ",
            ],
            title: "  Evening bright spots  ",
          },
          improveTomorrow: {
            placeholder:
              "  Name one kind adjustment for tomorrow.  ",
            title: "  How could tomorrow feel lighter?  ",
          },
          section: {
            description: "  Close gently, not critically.  ",
            title: "  Set the day down  ",
          },
        },
        morning: {
          affirmation: {
            placeholder: "  A line to carry into the day.  ",
            title: "  Daily anchor  ",
          },
          gratitudes: {
            description: "  Three quick noticings before motion.  ",
            placeholders: [
              "  A quiet good thing  ",
              "  Another piece of steadiness  ",
              "  ",
            ],
            title: "  Three steadies  ",
          },
          section: {
            description: "  Start by noticing what is already here.  ",
            title: "  Begin softly  ",
          },
          todayGreat: {
            placeholder: "  What would make today feel true?  ",
            title: "  What would matter most today?  ",
          },
        },
      }),
    ).toEqual({
      evening: {
        goodThings: {
          description: defaultJournalPromptConfig.evening.goodThings.description,
          placeholders: [
            "A calmer ending worth noting",
            defaultJournalPromptConfig.evening.goodThings.placeholders[1],
            "A small thing I want to remember",
          ],
          title: "Evening bright spots",
        },
        improveTomorrow: {
          placeholder: "Name one kind adjustment for tomorrow.",
          title: "How could tomorrow feel lighter?",
        },
        section: {
          description: "Close gently, not critically.",
          title: "Set the day down",
        },
      },
      morning: {
        affirmation: {
          placeholder: "A line to carry into the day.",
          title: "Daily anchor",
        },
        gratitudes: {
          description: "Three quick noticings before motion.",
          placeholders: [
            "A quiet good thing",
            "Another piece of steadiness",
            defaultJournalPromptConfig.morning.gratitudes.placeholders[2],
          ],
          title: "Three steadies",
        },
        section: {
          description: "Start by noticing what is already here.",
          title: "Begin softly",
        },
        todayGreat: {
          placeholder: "What would make today feel true?",
          title: "What would matter most today?",
        },
      },
    });
  });

  it("serializes normalized prompt config for storage", () => {
    expect(
      JSON.parse(
        serializeJournalPromptConfig({
          evening: defaultJournalPromptConfig.evening,
          morning: {
            ...defaultJournalPromptConfig.morning,
            section: {
              ...defaultJournalPromptConfig.morning.section,
              title: "  Open the page with intention  ",
            },
          },
        }),
      ),
    ).toMatchObject({
      morning: {
        section: {
          title: "Open the page with intention",
        },
      },
    });
  });
});
