import { describe, expect, it } from "vitest";

import {
  buildDailyEntryParsedTagSourceText,
  normalizeDailyEntryDraft,
} from "@/lib/journal/daily-entry-shared";
import { extractTagsFromText } from "@/lib/journal/tags";

describe("buildDailyEntryParsedTagSourceText", () => {
  it("combines morning, evening, and free-form fields for hashtag parsing", () => {
    const draft = normalizeDailyEntryDraft({
      affirmation: "Move with #clarity.",
      dailyCapture: "A quiet note about #deep_work.",
      entryDate: "2026-03-15",
      eveningGood1: "Dinner with #family-time.",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "Coffee and #sunrise.",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "Leave room for #rest.",
      manualTagSlugs: [],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: ["#not-counted"],
      todayGreat: "Make space for #focus.",
    });

    expect(extractTagsFromText(buildDailyEntryParsedTagSourceText(draft))).toEqual([
      { name: "clarity", slug: "clarity" },
      { name: "deep-work", slug: "deep-work" },
      { name: "family-time", slug: "family-time" },
      { name: "focus", slug: "focus" },
      { name: "rest", slug: "rest" },
      { name: "sunrise", slug: "sunrise" },
    ]);
  });
});
