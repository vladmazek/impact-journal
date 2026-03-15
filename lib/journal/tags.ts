export const MAX_TAG_LENGTH = 30;

export type NormalizedTag = {
  name: string;
  slug: string;
};

function normalizeAscii(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "");
}

export function buildNormalizedTag(value: string): NormalizedTag | null {
  const normalizedValue = normalizeAscii(value)
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TAG_LENGTH)
    .replace(/-+$/g, "");

  if (!normalizedValue) {
    return null;
  }

  return {
    name: normalizedValue,
    slug: normalizedValue,
  };
}

export function normalizeTagSlug(value: string) {
  return buildNormalizedTag(value)?.slug ?? null;
}

export function normalizeManualTagSlugs(values: string[] | null | undefined) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeTagSlug(value))
        .filter((value): value is string => value !== null),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function extractTagsFromText(value: string | null | undefined) {
  const normalizedTags = new Map<string, NormalizedTag>();
  const expression = /(^|[\s([{-])#([A-Za-z0-9][A-Za-z0-9_-]{0,49})/g;

  for (const match of normalizeAscii(value ?? "").matchAll(expression)) {
    const normalizedTag = buildNormalizedTag(match[2] ?? "");

    if (normalizedTag) {
      normalizedTags.set(normalizedTag.slug, normalizedTag);
    }
  }

  return Array.from(normalizedTags.values()).sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
}

export function formatTagLabel(slug: string) {
  return `#${slug}`;
}
