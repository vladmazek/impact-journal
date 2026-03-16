import { describe, expect, it } from "vitest";

import {
  getMotivationalQuotes,
  pickRandomMotivationalQuote,
} from "@/lib/motivational-quotes";

describe("motivational quotes", () => {
  it("loads at least one quote from the bundled quote file", () => {
    expect(getMotivationalQuotes().length).toBeGreaterThan(0);
  });

  it("returns the first quote when the random value is at the start of the range", () => {
    const firstQuote = getMotivationalQuotes()[0];

    expect(pickRandomMotivationalQuote(0)).toEqual(firstQuote);
  });

  it("returns the last quote when the random value is at the end of the range", () => {
    const quotes = getMotivationalQuotes();
    const lastQuote = quotes[quotes.length - 1];

    expect(pickRandomMotivationalQuote(0.999999)).toEqual(lastQuote);
  });
});
