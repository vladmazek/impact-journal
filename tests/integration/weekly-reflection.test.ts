import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  loadWeeklyReflectionForUser,
  saveWeeklyReflectionForUser,
} from "@/lib/journal/weekly-reflection";
import { prisma } from "@/lib/prisma";
import {
  countWeeklyReflections,
  createOwnerUser,
  resetTestState,
} from "@/tests/helpers/test-db";

describe("weekly reflection persistence", () => {
  beforeEach(async () => {
    await resetTestState();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates and updates one weekly reflection row with deterministic life area sync", async () => {
    const { user } = await createOwnerUser();

    const firstSave = await saveWeeklyReflectionForUser(user.id, {
      feltOff: "",
      hardMoments: "",
      isoWeek: 11,
      isoYear: 2026,
      lifeAreaRatings: [
        { areaKey: "work", note: "Steady sprint.", rating: 4 },
        { areaKey: "family_home", note: "", rating: 5 },
        { areaKey: "health", note: "", rating: 3 },
        { areaKey: "stress", note: "", rating: 2 },
        { areaKey: "personal_fulfillment", note: "", rating: 4 },
      ],
      nextWeekIntention: "Keep the pace gentle.",
      overallMoodEmoji: "🙂",
      overallMoodLabel: "Good",
      overallMoodValue: "good",
      summaryContext: "Mostly steady with a few sharp edges.",
      wins: "Protected time for the work that mattered.",
    });

    const secondSave = await saveWeeklyReflectionForUser(user.id, {
      feltOff: "Too much context switching.",
      hardMoments: "A rough Thursday afternoon.",
      isoWeek: 11,
      isoYear: 2026,
      lifeAreaRatings: [
        { areaKey: "work", note: "Still strong.", rating: 4 },
        { areaKey: "family_home", note: "Good dinners together.", rating: 4 },
        { areaKey: "health", note: "", rating: 3 },
        { areaKey: "stress", note: "Better by the weekend.", rating: 3 },
        { areaKey: "personal_fulfillment", note: "", rating: 5 },
      ],
      nextWeekIntention: "Protect morning focus.",
      overallMoodEmoji: "🙂",
      overallMoodLabel: "Good",
      overallMoodValue: "good",
      summaryContext: "A steadier finish than the middle of the week suggested.",
      wins: "Made space for the important parts.",
    });

    const reflection = await loadWeeklyReflectionForUser(user.id, 2026, 11);

    expect(firstSave.reflectionId).toBeTruthy();
    expect(secondSave.reflectionId).toBe(firstSave.reflectionId);
    expect(await countWeeklyReflections()).toBe(1);
    expect(reflection.summaryContext).toBe(
      "A steadier finish than the middle of the week suggested.",
    );
    expect(reflection.lifeAreaRatings.find((rating) => rating.areaKey === "family_home")?.rating).toBe(4);
    expect(reflection.lifeAreaRatings.find((rating) => rating.areaKey === "stress")?.note).toBe(
      "Better by the weekend.",
    );
  });

  it("suppresses a blank weekly reflection until meaningful content exists", async () => {
    const { user } = await createOwnerUser();

    const result = await saveWeeklyReflectionForUser(user.id, {
      feltOff: "",
      hardMoments: "",
      isoWeek: 12,
      isoYear: 2026,
      lifeAreaRatings: [
        { areaKey: "work", note: "", rating: null },
        { areaKey: "family_home", note: "", rating: null },
        { areaKey: "health", note: "", rating: null },
        { areaKey: "stress", note: "", rating: null },
        { areaKey: "personal_fulfillment", note: "", rating: null },
      ],
      nextWeekIntention: "",
      overallMoodEmoji: null,
      overallMoodLabel: null,
      overallMoodValue: null,
      summaryContext: "",
      wins: "",
    });

    expect(result.reflectionId).toBeNull();
    expect(await countWeeklyReflections()).toBe(0);
  });
});
