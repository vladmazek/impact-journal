import { describe, expect, it } from "vitest";

import {
  getDateSlugsForIsoWeek,
  getIsoWeekPartsFromDateSlug,
  resolveDailyPromptSection,
  resolveMorningSceneVariant,
  resolveCurrentIsoWeek,
  resolveHourInTimeZone,
  resolveTodayDateSlug,
  shiftIsoWeek,
} from "@/lib/date";

describe("resolveTodayDateSlug", () => {
  it("keeps the same calendar date when the timezone has not crossed midnight", () => {
    expect(
      resolveTodayDateSlug(new Date("2026-03-14T15:30:00.000Z"), "America/New_York"),
    ).toBe("2026-03-14");
  });

  it("rolls backward when the timezone is still on the previous day", () => {
    expect(
      resolveTodayDateSlug(new Date("2026-03-14T03:30:00.000Z"), "America/New_York"),
    ).toBe("2026-03-13");
  });

  it("rolls forward when the timezone has already reached tomorrow", () => {
    expect(
      resolveTodayDateSlug(new Date("2026-03-14T23:30:00.000Z"), "Pacific/Auckland"),
    ).toBe("2026-03-15");
  });
});

describe("resolveHourInTimeZone", () => {
  it("stays in the morning before local noon", () => {
    expect(
      resolveHourInTimeZone(new Date("2026-03-15T18:30:00.000Z"), "America/Phoenix"),
    ).toBe(11);
  });

  it("crosses into noon at the local 12 o'clock hour", () => {
    expect(
      resolveHourInTimeZone(new Date("2026-03-15T19:30:00.000Z"), "America/Phoenix"),
    ).toBe(12);
  });
});

describe("resolveDailyPromptSection", () => {
  it("returns morning before local noon", () => {
    expect(
      resolveDailyPromptSection(new Date("2026-03-15T18:30:00.000Z"), "America/Phoenix"),
    ).toBe("morning");
  });

  it("returns evening at local noon", () => {
    expect(
      resolveDailyPromptSection(new Date("2026-03-15T19:00:00.000Z"), "America/Phoenix"),
    ).toBe("evening");
  });

  it("returns evening after local noon", () => {
    expect(
      resolveDailyPromptSection(new Date("2026-03-15T21:30:00.000Z"), "America/Phoenix"),
    ).toBe("evening");
  });
});

describe("resolveMorningSceneVariant", () => {
  it("uses the default morning artwork before the early window", () => {
    expect(resolveMorningSceneVariant(new Date("2026-03-30T05:44:00"))).toBe("default");
  });

  it("switches to the early-morning artwork at 5:45 AM", () => {
    expect(resolveMorningSceneVariant(new Date("2026-03-30T05:45:00"))).toBe("early");
  });

  it("keeps the early-morning artwork through 7:30 AM", () => {
    expect(resolveMorningSceneVariant(new Date("2026-03-30T07:30:00"))).toBe("early");
  });

  it("returns to the default morning artwork after 7:30 AM", () => {
    expect(resolveMorningSceneVariant(new Date("2026-03-30T07:31:00"))).toBe("default");
  });
});

describe("ISO week helpers", () => {
  it("resolves ISO week boundaries around the new year correctly", () => {
    expect(getIsoWeekPartsFromDateSlug("2026-01-01")).toEqual({
      isoWeek: 1,
      isoYear: 2026,
    });
    expect(getIsoWeekPartsFromDateSlug("2027-01-01")).toEqual({
      isoWeek: 53,
      isoYear: 2026,
    });
  });

  it("maps an ISO week to its monday-through-sunday date slugs", () => {
    expect(getDateSlugsForIsoWeek(2026, 11)).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
  });

  it("shifts weeks across year boundaries", () => {
    expect(shiftIsoWeek(2026, 1, -1)).toEqual({
      isoWeek: 52,
      isoYear: 2025,
    });
  });

  it("resolves the current ISO week using the stored timezone", () => {
    expect(
      resolveCurrentIsoWeek(new Date("2026-03-14T23:30:00.000Z"), "Pacific/Auckland"),
    ).toEqual({
      isoWeek: 11,
      isoYear: 2026,
    });
  });
});
