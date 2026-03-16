import { File } from "node:buffer";
import { access, readFile } from "node:fs/promises";

import { EntryStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { dateSlugToUtcDate } from "@/lib/date";
import {
  deleteDailyEntryImageForUser,
  saveDailyEntryForUser,
  uploadDailyEntryImagesForUser,
} from "@/lib/journal/daily-entry";
import { resolveMediaPath, saveUploadedImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { imageFixturePath } from "@/tests/helpers/media-fixtures";
import {
  countDailyEntries,
  countImageAttachments,
  createOwnerUser,
  findDailyEntryByDate,
  resetTestState,
} from "@/tests/helpers/test-db";

describe("daily entry persistence", () => {
  beforeEach(async () => {
    await resetTestState();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("suppresses blank entries until meaningful content exists", async () => {
    const { user } = await createOwnerUser();

    const result = await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-14",
      eveningGood1: "",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: [],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: [],
      todayGreat: "",
    });

    expect(result.entryId).toBeNull();
    expect(result.status).toBe("not_started");
    expect(await countDailyEntries()).toBe(0);
  });

  it("creates one row on first save and updates the same row on later saves", async () => {
    const { user } = await createOwnerUser();

    const firstSave = await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-14",
      eveningGood1: "",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "Coffee on the porch",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: [],
      moodEmoji: "😄",
      moodLabel: "Great",
      moodValue: "great",
      relaxItems: [],
      todayGreat: "",
    });

    const secondSave = await saveDailyEntryForUser(user.id, {
      affirmation: "Slow is still progress.",
      dailyCapture: "A little more detail arrived later in the day.",
      entryDate: "2026-03-14",
      eveningGood1: "A calm walk",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "Coffee on the porch",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: [],
      moodEmoji: "😄",
      moodLabel: "Great",
      moodValue: "great",
      relaxItems: [],
      todayGreat: "",
    });

    expect(firstSave.entryId).toBeTruthy();
    expect(secondSave.entryId).toBe(firstSave.entryId);
    expect(await countDailyEntries()).toBe(1);

    const persistedEntry = await findDailyEntryByDate(
      user.id,
      dateSlugToUtcDate("2026-03-14"),
    );

    expect(persistedEntry?.affirmation).toBe("Slow is still progress.");
    expect(persistedEntry?.dailyCapture).toBe("A little more detail arrived later in the day.");
    expect(persistedEntry?.status).toBe(EntryStatus.COMPLETED);
  });

  it("replaces relax items transactionally and preserves explicit order", async () => {
    const { user } = await createOwnerUser();

    await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-14",
      eveningGood1: "",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: [],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: ["Tea", "Stretch", "Read"],
      todayGreat: "",
    });

    await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-14",
      eveningGood1: "",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: [],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: ["Walk", "Breathing"],
      todayGreat: "",
    });

    const persistedEntry = await findDailyEntryByDate(
      user.id,
      dateSlugToUtcDate("2026-03-14"),
    );

    expect(persistedEntry?.relaxItems.map((item) => item.text)).toEqual([
      "Walk",
      "Breathing",
    ]);
  });

  it("merges manual tags with parsed hashtags and deduplicates them into one logical tag", async () => {
    const { user } = await createOwnerUser();

    await saveDailyEntryForUser(user.id, {
      affirmation: "Stay with #deep-work.",
      dailyCapture: "",
      entryDate: "2026-03-14",
      eveningGood1: "A calm dinner with #Family_Time.",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: ["family-time", "deep-work"],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: [],
      todayGreat: "",
    });

    const persistedEntry = await findDailyEntryByDate(
      user.id,
      dateSlugToUtcDate("2026-03-14"),
    );

    expect(persistedEntry?.tags.map((tag) => `${tag.tag.slug}:${tag.isManual}`)).toEqual([
      "deep-work:true",
      "family-time:true",
    ]);
  });

  it("parses hashtags from morning, evening, and free-form fields together", async () => {
    const { user } = await createOwnerUser();

    await saveDailyEntryForUser(user.id, {
      affirmation: "Keep it steady with #clarity.",
      dailyCapture: "A late note about #deep-work.",
      entryDate: "2026-03-14",
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
      relaxItems: [],
      todayGreat: "A gentle plan for #focus.",
    });

    const persistedEntry = await findDailyEntryByDate(
      user.id,
      dateSlugToUtcDate("2026-03-14"),
    );

    expect(persistedEntry?.tags.map((tag) => `${tag.tag.slug}:${tag.isManual}`)).toEqual([
      "clarity:false",
      "deep-work:false",
      "family-time:false",
      "focus:false",
      "rest:false",
      "sunrise:false",
    ]);
  });

  it("removes parsed-only tags when the hashtag leaves the writing but keeps manually pinned tags", async () => {
    const { user } = await createOwnerUser();

    await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-15",
      eveningGood1: "A good day with #sunset.",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "#family-time showed up early.",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: ["family-time"],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: [],
      todayGreat: "",
    });

    await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-15",
      eveningGood1: "A good day with family and a long walk.",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "Family showed up early.",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: ["family-time"],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: [],
      todayGreat: "",
    });

    const persistedEntry = await findDailyEntryByDate(
      user.id,
      dateSlugToUtcDate("2026-03-15"),
    );

    expect(persistedEntry?.tags.map((tag) => `${tag.tag.slug}:${tag.isManual}`)).toEqual([
      "family-time:true",
    ]);
  });

  it("prunes an otherwise blank entry when its final manual tag is removed", async () => {
    const { user } = await createOwnerUser();

    await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-16",
      eveningGood1: "",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: ["focus"],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: [],
      todayGreat: "",
    });

    const result = await saveDailyEntryForUser(user.id, {
      affirmation: "",
      dailyCapture: "",
      entryDate: "2026-03-16",
      eveningGood1: "",
      eveningGood2: "",
      eveningGood3: "",
      gratitude1: "",
      gratitude2: "",
      gratitude3: "",
      improveTomorrow: "",
      manualTagSlugs: [],
      moodEmoji: null,
      moodLabel: null,
      moodValue: null,
      relaxItems: [],
      todayGreat: "",
    });

    expect(result.entryId).toBeNull();
    expect(await countDailyEntries()).toBe(0);
  });

  it("treats image uploads as meaningful content and prunes an image-only entry when the last image is deleted", async () => {
    const { user } = await createOwnerUser();
    const pngBuffer = await readFile(imageFixturePath("tiny.png"));

    const storedImage = await saveUploadedImage(
      new File([pngBuffer], "tiny.png", { type: "image/png" }),
      {
        baseName: "sunset",
        bucket: "originals",
        dateSlug: "2026-03-14",
      },
    );

    const uploadResult = await uploadDailyEntryImagesForUser(user.id, "2026-03-14", [
      storedImage,
    ]);
    const absoluteMediaPath = resolveMediaPath(storedImage.relativePath);

    expect(uploadResult.status).toBe("in_progress");
    expect(uploadResult.imageAttachments).toHaveLength(1);
    expect(await countDailyEntries()).toBe(1);
    expect(await countImageAttachments()).toBe(1);
    await access(absoluteMediaPath);

    const deleteResult = await deleteDailyEntryImageForUser(
      user.id,
      uploadResult.imageAttachments[0].id,
    );

    expect(deleteResult.entryDeleted).toBe(true);
    expect(await countDailyEntries()).toBe(0);
    expect(await countImageAttachments()).toBe(0);
    await expect(access(absoluteMediaPath)).rejects.toThrow();
  });
});
