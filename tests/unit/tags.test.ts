import { describe, expect, it } from "vitest";

import {
  buildNormalizedTag,
  extractTagsFromText,
  normalizeManualTagSlugs,
} from "@/lib/journal/tags";

describe("tag helpers", () => {
  it("normalizes mixed spacing and casing into one canonical slug", () => {
    expect(buildNormalizedTag("  #Deep Work  ")).toEqual({
      name: "deep-work",
      slug: "deep-work",
    });
  });

  it("deduplicates manual tag slugs after normalization", () => {
    expect(normalizeManualTagSlugs(["Deep Work", "deep-work", "#deep_work"])).toEqual([
      "deep-work",
    ]);
  });

  it("extracts hashtags from daily capture and normalizes them consistently", () => {
    expect(
      extractTagsFromText("A good day for #Deep_Work, #family-time, and #family_time again."),
    ).toEqual([
      { name: "deep-work", slug: "deep-work" },
      { name: "family-time", slug: "family-time" },
    ]);
  });

  it("rejects tags that normalize down to nothing", () => {
    expect(buildNormalizedTag("###")).toBeNull();
  });
});
