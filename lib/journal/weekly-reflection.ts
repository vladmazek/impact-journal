import { EntryStatus } from "@prisma/client";

import {
  dateSlugToUtcDate,
  dbDateToDateSlug,
  formatIsoWeekLabel,
  formatIsoWeekRange,
  formatWeekdayShortFromSlug,
  getDateSlugsForIsoWeek,
  isValidIsoWeekParts,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { type DailyEntryStatus } from "@/lib/journal/daily-entry-shared";
import {
  createEmptyWeeklyReflection,
  isWeeklyReflectionEffectivelyEmpty,
  normalizeWeeklyReflectionDraft,
  type WeeklyLifeAreaKey,
  type WeeklyDaySummary,
  type WeeklyReflectionDraft,
  type WeeklyReflectionRecord,
  type WeeklyReflectionSaveResult,
} from "@/lib/journal/weekly-reflection-shared";

function statusToClient(status: EntryStatus): DailyEntryStatus {
  switch (status) {
    case EntryStatus.COMPLETED:
      return "completed";
    case EntryStatus.IN_PROGRESS:
      return "in_progress";
    default:
      return "not_started";
  }
}

function nullableText(value: string) {
  return value.length > 0 ? value : null;
}

async function loadWeekContext(userId: string, isoYear: number, isoWeek: number) {
  const daySlugs = getDateSlugsForIsoWeek(isoYear, isoWeek);
  const [weekStart, , , , , , weekEnd] = daySlugs;

  const entries = await prisma.dailyEntry.findMany({
    where: {
      entryDate: {
        gte: dateSlugToUtcDate(weekStart),
        lte: dateSlugToUtcDate(weekEnd),
      },
      userId,
    },
    orderBy: {
      entryDate: "asc",
    },
    include: {
      tags: {
        orderBy: {
          tag: {
            slug: "asc",
          },
        },
        include: {
          tag: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  const entriesByDate = new Map(
    entries.map((entry) => [dbDateToDateSlug(entry.entryDate), entry]),
  );

  return {
    completedEntryCount: entries.filter((entry) => entry.status === EntryStatus.COMPLETED).length,
    daySummaries: daySlugs.map((dateSlug) => {
      const entry = entriesByDate.get(dateSlug);

      return {
        dayLabel: formatWeekdayShortFromSlug(dateSlug),
        entryDate: dateSlug,
        hasEntry: Boolean(entry),
        moodEmoji: entry?.moodEmoji ?? null,
        moodLabel: entry?.moodLabel ?? null,
        status: entry ? statusToClient(entry.status) : "not_started",
        tagSlugs: entry?.tags.map((tag) => tag.tag.slug) ?? [],
      } satisfies WeeklyDaySummary;
    }),
    weekLabel: formatIsoWeekLabel(isoYear, isoWeek),
    weekRangeLabel: formatIsoWeekRange(isoYear, isoWeek),
  };
}

export async function loadWeeklyReflectionForUser(
  userId: string,
  isoYear: number,
  isoWeek: number,
): Promise<WeeklyReflectionRecord> {
  if (!isValidIsoWeekParts(isoYear, isoWeek)) {
    throw new Error(`Invalid ISO week: ${isoYear}-W${isoWeek}`);
  }

  const [reflection, weekContext] = await Promise.all([
    prisma.weeklyReflection.findUnique({
      where: {
        userId_isoYear_isoWeek: {
          isoWeek,
          isoYear,
          userId,
        },
      },
      include: {
        lifeAreaRatings: true,
      },
    }),
    loadWeekContext(userId, isoYear, isoWeek),
  ]);

  if (!reflection) {
    return createEmptyWeeklyReflection(isoYear, isoWeek, weekContext);
  }

  const normalizedDraft = normalizeWeeklyReflectionDraft({
    feltOff: reflection.feltOff ?? "",
    hardMoments: reflection.hardMoments ?? "",
    isoWeek: reflection.isoWeek,
    isoYear: reflection.isoYear,
    lifeAreaRatings: reflection.lifeAreaRatings.map((rating) => ({
      areaKey: rating.areaKey as WeeklyLifeAreaKey,
      note: rating.note ?? "",
      rating: rating.rating,
    })),
    nextWeekIntention: reflection.nextWeekIntention ?? "",
    overallMoodEmoji: reflection.overallMoodEmoji,
    overallMoodLabel: reflection.overallMoodLabel,
    overallMoodValue: reflection.overallMoodValue,
    summaryContext: reflection.energySummary ?? "",
    wins: reflection.wins ?? "",
  });

  return {
    ...normalizedDraft,
    completedEntryCount: weekContext.completedEntryCount,
    daySummaries: weekContext.daySummaries,
    exists: true,
    reflectionId: reflection.id,
    updatedAt: reflection.updatedAt.toISOString(),
    weekLabel: weekContext.weekLabel,
    weekRangeLabel: weekContext.weekRangeLabel,
  };
}

export async function saveWeeklyReflectionForUser(
  userId: string,
  draft: WeeklyReflectionDraft,
): Promise<WeeklyReflectionSaveResult> {
  const normalizedDraft = normalizeWeeklyReflectionDraft(draft);

  if (!isValidIsoWeekParts(normalizedDraft.isoYear, normalizedDraft.isoWeek)) {
    throw new Error(
      `Invalid ISO week: ${normalizedDraft.isoYear}-W${normalizedDraft.isoWeek}`,
    );
  }

  if (isWeeklyReflectionEffectivelyEmpty(normalizedDraft)) {
    await prisma.weeklyReflection.deleteMany({
      where: {
        isoWeek: normalizedDraft.isoWeek,
        isoYear: normalizedDraft.isoYear,
        userId,
      },
    });

    const weekContext = await loadWeekContext(userId, normalizedDraft.isoYear, normalizedDraft.isoWeek);

    return {
      completedEntryCount: weekContext.completedEntryCount,
      daySummaries: weekContext.daySummaries,
      reflectionId: null,
      updatedAt: null,
    };
  }

  const reflection = await prisma.$transaction(async (tx) => {
    const persistedReflection = await tx.weeklyReflection.upsert({
      where: {
        userId_isoYear_isoWeek: {
          isoWeek: normalizedDraft.isoWeek,
          isoYear: normalizedDraft.isoYear,
          userId,
        },
      },
      update: {
        energySummary: nullableText(normalizedDraft.summaryContext),
        feltOff: nullableText(normalizedDraft.feltOff),
        hardMoments: nullableText(normalizedDraft.hardMoments),
        nextWeekIntention: nullableText(normalizedDraft.nextWeekIntention),
        overallMoodEmoji: normalizedDraft.overallMoodEmoji,
        overallMoodLabel: normalizedDraft.overallMoodLabel,
        overallMoodValue: normalizedDraft.overallMoodValue,
        wins: nullableText(normalizedDraft.wins),
      },
      create: {
        energySummary: nullableText(normalizedDraft.summaryContext),
        feltOff: nullableText(normalizedDraft.feltOff),
        hardMoments: nullableText(normalizedDraft.hardMoments),
        isoWeek: normalizedDraft.isoWeek,
        isoYear: normalizedDraft.isoYear,
        nextWeekIntention: nullableText(normalizedDraft.nextWeekIntention),
        overallMoodEmoji: normalizedDraft.overallMoodEmoji,
        overallMoodLabel: normalizedDraft.overallMoodLabel,
        overallMoodValue: normalizedDraft.overallMoodValue,
        userId,
        wins: nullableText(normalizedDraft.wins),
      },
    });

    await tx.weeklyLifeAreaRating.deleteMany({
      where: {
        weeklyReflectionId: persistedReflection.id,
      },
    });

    const ratingsToPersist = normalizedDraft.lifeAreaRatings.filter(
      (rating) => rating.rating !== null,
    );

    if (ratingsToPersist.length > 0) {
      await tx.weeklyLifeAreaRating.createMany({
        data: ratingsToPersist.map((rating) => ({
          areaKey: rating.areaKey,
          note: nullableText(rating.note),
          rating: rating.rating as number,
          weeklyReflectionId: persistedReflection.id,
        })),
      });
    }

    return persistedReflection;
  });

  const weekContext = await loadWeekContext(userId, normalizedDraft.isoYear, normalizedDraft.isoWeek);

  return {
    completedEntryCount: weekContext.completedEntryCount,
    daySummaries: weekContext.daySummaries,
    reflectionId: reflection.id,
    updatedAt: reflection.updatedAt.toISOString(),
  };
}
