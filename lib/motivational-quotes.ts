import quoteRecords from "@/quotes.json";

export type MotivationalQuote = {
  author: string;
  quote: string;
};

const motivationalQuotes: ReadonlyArray<MotivationalQuote> = quoteRecords;

export function pickRandomMotivationalQuote(randomValue = Math.random()): MotivationalQuote {
  if (motivationalQuotes.length === 0) {
    throw new Error("At least one motivational quote is required.");
  }

  const normalizedRandomValue = Math.min(Math.max(randomValue, 0), 0.999999999999);
  const quoteIndex = Math.floor(normalizedRandomValue * motivationalQuotes.length);

  return motivationalQuotes[quoteIndex]!;
}

export function getMotivationalQuotes() {
  return motivationalQuotes;
}
