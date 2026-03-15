import { describe, expect, it } from "vitest";

import {
  getDateSlugsForIsoWeek,
  getIsoWeekPartsFromDateSlug,
  resolveCurrentIsoWeek,
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
