import { EntryStatus, type Prisma } from "@prisma/client";

import { dbDateToDateSlug, dateSlugToUtcDate, isValidDateSlug } from "@/lib/date";
import { removeStoredFile, type StoredImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import {
  createEmptyDailyEntry,
  inferDailyEntryStatus,
  isDailyEntryEffectivelyEmpty,
  normalizeDailyEntryDraft,
  type DailyEntryDraft,
  type DailyEntryRecord,
  type DailyEntrySaveResult,
  type DailyEntryStatus,
  type ImageAttachmentRecord,
  type TagRecord,
  type TagSuggestionRecord,
} from "@/lib/journal/daily-entry-shared";
import { extractTagsFromText } from "@/lib/journal/tags";

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

function statusToPrisma(status: DailyEntryStatus) {
  switch (status) {
    case "completed":
      return EntryStatus.COMPLETED;
    case "in_progress":
      return EntryStatus.IN_PROGRESS;
    default:
      return EntryStatus.NOT_STARTED;
  }
}

function nullableText(value: string) {
  return value.length > 0 ? value : null;
}

type DailyEntryStatusSnapshot = Prisma.DailyEntryGetPayload<{
  include: {
    imageAttachments: {
      orderBy: {
        sortOrder: "asc";
      };
    };
    relaxItems: true;
    _count: {
      select: {
        imageAttachments: true;
        tags: true;
      };
    };
  };
}>;

function mapImageAttachment(
  attachment: {
    byteSize: number;
    extension: string;
    height: number | null;
    id: string;
    mimeType: string;
    originalFilename: string;
    relativePath: string;
    sortOrder: number;
    storedFilename: string;
    width: number | null;
  },
): ImageAttachmentRecord {
  return {
    byteSize: attachment.byteSize,
    extension: attachment.extension,
    height: attachment.height,
    id: attachment.id,
    mimeType: attachment.mimeType,
    originalFilename: attachment.originalFilename,
    relativePath: attachment.relativePath,
    sortOrder: attachment.sortOrder,
    storedFilename: attachment.storedFilename,
    width: attachment.width,
  };
}

function mapEntryTag(entryTag: {
  isManual: boolean;
  tag: {
    id: string;
    name: string;
    slug: string;
  };
}): TagRecord {
  return {
    id: entryTag.tag.id,
    isManual: entryTag.isManual,
    name: entryTag.tag.name,
    slug: entryTag.tag.slug,
  };
}

function mapTagSuggestion(tag: {
  id: string;
  name: string;
  slug: string;
}): TagSuggestionRecord {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

async function loadTagSuggestionsForUser(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { slug: "asc" }],
    take: 16,
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return tags.map(mapTagSuggestion);
}

function toEntryCreateOrUpdateInput(
  normalizedDraft: DailyEntryDraft,
  status: DailyEntryStatus,
) {
  return {
    affirmation: nullableText(normalizedDraft.affirmation),
    dailyCapture: nullableText(normalizedDraft.dailyCapture),
    entryDate: dateSlugToUtcDate(normalizedDraft.entryDate),
    eveningGood1: nullableText(normalizedDraft.eveningGood1),
    eveningGood2: nullableText(normalizedDraft.eveningGood2),
    eveningGood3: nullableText(normalizedDraft.eveningGood3),
    gratitude1: nullableText(normalizedDraft.gratitude1),
    gratitude2: nullableText(normalizedDraft.gratitude2),
    gratitude3: nullableText(normalizedDraft.gratitude3),
    improveTomorrow: nullableText(normalizedDraft.improveTomorrow),
    moodEmoji: normalizedDraft.moodEmoji,
    moodLabel: normalizedDraft.moodLabel,
    moodValue: normalizedDraft.moodValue,
    status: statusToPrisma(status),
    todayGreat: nullableText(normalizedDraft.todayGreat),
  } satisfies Omit<Prisma.DailyEntryUncheckedCreateInput, "userId">;
}

function entrySnapshotToDraft(entry: {
  affirmation: string | null;
  dailyCapture: string | null;
  entryDate: Date;
  eveningGood1: string | null;
  eveningGood2: string | null;
  eveningGood3: string | null;
  gratitude1: string | null;
  gratitude2: string | null;
  gratitude3: string | null;
  improveTomorrow: string | null;
  moodEmoji: string | null;
  moodLabel: string | null;
  moodValue: string | null;
  relaxItems: Array<{ text: string }>;
  todayGreat: string | null;
}): DailyEntryDraft {
  return normalizeDailyEntryDraft({
    affirmation: entry.affirmation ?? "",
    dailyCapture: entry.dailyCapture ?? "",
    entryDate: dbDateToDateSlug(entry.entryDate),
    eveningGood1: entry.eveningGood1 ?? "",
    eveningGood2: entry.eveningGood2 ?? "",
    eveningGood3: entry.eveningGood3 ?? "",
    gratitude1: entry.gratitude1 ?? "",
    gratitude2: entry.gratitude2 ?? "",
    gratitude3: entry.gratitude3 ?? "",
    improveTomorrow: entry.improveTomorrow ?? "",
    manualTagSlugs: [],
    moodEmoji: entry.moodEmoji,
    moodLabel: entry.moodLabel,
    moodValue: entry.moodValue,
    relaxItems: entry.relaxItems.map((item) => item.text),
    todayGreat: entry.todayGreat ?? "",
  });
}

function inferStatusFromSnapshot(entry: DailyEntryStatusSnapshot) {
  return inferDailyEntryStatus(entrySnapshotToDraft(entry), {
    imageCount: entry._count.imageAttachments,
    tagCount: entry._count.tags,
  });
}

function isSnapshotEmpty(entry: DailyEntryStatusSnapshot) {
  return isDailyEntryEffectivelyEmpty(entrySnapshotToDraft(entry), {
    imageCount: entry._count.imageAttachments,
    tagCount: entry._count.tags,
  });
}

async function loadStatusSnapshot(tx: Prisma.TransactionClient, dailyEntryId: string) {
  return tx.dailyEntry.findUnique({
    where: { id: dailyEntryId },
    include: {
      imageAttachments: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      relaxItems: true,
      _count: {
        select: {
          imageAttachments: true,
          tags: true,
        },
      },
    },
  });
}

async function normalizeImageAttachmentSortOrder(
  tx: Prisma.TransactionClient,
  dailyEntryId: string,
) {
  const attachments = await tx.imageAttachment.findMany({
    where: { dailyEntryId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      sortOrder: true,
    },
  });

  await Promise.all(
    attachments.map((attachment, index) => {
      if (attachment.sortOrder === index) {
        return Promise.resolve();
      }

      return tx.imageAttachment.update({
        where: { id: attachment.id },
        data: {
          sortOrder: index,
        },
      });
    }),
  );
}

async function syncDailyEntryStatus(
  tx: Prisma.TransactionClient,
  dailyEntryId: string,
) {
  const snapshot = await loadStatusSnapshot(tx, dailyEntryId);

  if (!snapshot) {
    return null;
  }

  const nextStatus = inferStatusFromSnapshot(snapshot);

  if (statusToClient(snapshot.status) === nextStatus) {
    return snapshot;
  }

  await tx.dailyEntry.update({
    where: { id: dailyEntryId },
    data: {
      status: statusToPrisma(nextStatus),
    },
  });

  return loadStatusSnapshot(tx, dailyEntryId);
}

async function pruneEmptyDailyEntryIfNeeded(
  tx: Prisma.TransactionClient,
  dailyEntryId: string,
) {
  const snapshot = await loadStatusSnapshot(tx, dailyEntryId);

  if (!snapshot) {
    return { deleted: true as const, snapshot: null };
  }

  if (!isSnapshotEmpty(snapshot)) {
    return { deleted: false as const, snapshot };
  }

  await tx.dailyEntry.delete({
    where: { id: dailyEntryId },
  });

  return { deleted: true as const, snapshot: null };
}

async function syncDailyEntryTags(
  tx: Prisma.TransactionClient,
  userId: string,
  dailyEntryId: string,
  draft: DailyEntryDraft,
) {
  const parsedTags = extractTagsFromText(draft.dailyCapture);
  const tagMap = new Map(parsedTags.map((tag) => [tag.slug, tag]));

  for (const slug of draft.manualTagSlugs) {
    if (!tagMap.has(slug)) {
      tagMap.set(slug, {
        name: slug,
        slug,
      });
    }
  }

  const nextTags = Array.from(tagMap.values());

  if (nextTags.length === 0) {
    await tx.dailyEntryTag.deleteMany({
      where: {
        dailyEntryId,
      },
    });

    return [] as TagRecord[];
  }

  const persistedTags = await Promise.all(
    nextTags.map((tag) =>
      tx.tag.upsert({
        where: {
          userId_slug: {
            slug: tag.slug,
            userId,
          },
        },
        update: {
          name: tag.name,
        },
        create: {
          name: tag.name,
          slug: tag.slug,
          userId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
    ),
  );

  const persistedTagIds = persistedTags.map((tag) => tag.id);

  await tx.dailyEntryTag.deleteMany({
    where: {
      dailyEntryId,
      tagId: {
        notIn: persistedTagIds,
      },
    },
  });

  await Promise.all(
    persistedTags.map((tag) =>
      tx.dailyEntryTag.upsert({
        where: {
          dailyEntryId_tagId: {
            dailyEntryId,
            tagId: tag.id,
          },
        },
        update: {
          isManual: draft.manualTagSlugs.includes(tag.slug),
        },
        create: {
          dailyEntryId,
          isManual: draft.manualTagSlugs.includes(tag.slug),
          tagId: tag.id,
        },
      }),
    ),
  );

  return persistedTags
    .map((tag) => ({
      id: tag.id,
      isManual: draft.manualTagSlugs.includes(tag.slug),
      name: tag.name,
      slug: tag.slug,
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function loadDailyEntryForUser(
  userId: string,
  entryDate: string,
): Promise<DailyEntryRecord> {
  if (!isValidDateSlug(entryDate)) {
    throw new Error(`Invalid entry date: ${entryDate}`);
  }

  const [entry, tagSuggestions] = await Promise.all([
    prisma.dailyEntry.findUnique({
      where: {
        userId_entryDate: {
          entryDate: dateSlugToUtcDate(entryDate),
          userId,
        },
      },
      include: {
        imageAttachments: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        relaxItems: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        tags: {
          orderBy: {
            tag: {
              slug: "asc",
            },
          },
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    loadTagSuggestionsForUser(userId),
  ]);

  if (!entry) {
    return {
      ...createEmptyDailyEntry(entryDate),
      tagSuggestions,
    };
  }

  const tags = entry.tags.map(mapEntryTag);

  return {
    affirmation: entry.affirmation ?? "",
    dailyCapture: entry.dailyCapture ?? "",
    entryDate: dbDateToDateSlug(entry.entryDate),
    entryId: entry.id,
    eveningGood1: entry.eveningGood1 ?? "",
    eveningGood2: entry.eveningGood2 ?? "",
    eveningGood3: entry.eveningGood3 ?? "",
    exists: true,
    gratitude1: entry.gratitude1 ?? "",
    gratitude2: entry.gratitude2 ?? "",
    gratitude3: entry.gratitude3 ?? "",
    imageAttachments: entry.imageAttachments.map(mapImageAttachment),
    improveTomorrow: entry.improveTomorrow ?? "",
    manualTagSlugs: tags.filter((tag) => tag.isManual).map((tag) => tag.slug),
    moodEmoji: entry.moodEmoji,
    moodLabel: entry.moodLabel,
    moodValue: entry.moodValue,
    relaxItems: entry.relaxItems.map((item) => item.text),
    status: statusToClient(entry.status),
    tagSuggestions,
    tags,
    todayGreat: entry.todayGreat ?? "",
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function saveDailyEntryForUser(
  userId: string,
  draft: DailyEntryDraft,
): Promise<DailyEntrySaveResult> {
  const normalizedDraft = normalizeDailyEntryDraft(draft);
  const parsedTags = extractTagsFromText(normalizedDraft.dailyCapture);
  const tagCount = new Set([
    ...normalizedDraft.manualTagSlugs,
    ...parsedTags.map((tag) => tag.slug),
  ]).size;

  const existingEntry = await prisma.dailyEntry.findUnique({
    where: {
      userId_entryDate: {
        entryDate: dateSlugToUtcDate(normalizedDraft.entryDate),
        userId,
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          imageAttachments: true,
        },
      },
    },
  });

  const imageCount = existingEntry?._count.imageAttachments ?? 0;
  const status = inferDailyEntryStatus(normalizedDraft, {
    imageCount,
    tagCount,
  });

  if (status === "not_started" && imageCount === 0 && tagCount === 0) {
    if (existingEntry) {
      await prisma.dailyEntry.delete({
        where: {
          id: existingEntry.id,
        },
      });
    }

    return {
      entryId: null,
      relaxItems: [],
      status,
      tagSuggestions: await loadTagSuggestionsForUser(userId),
      tags: [],
      updatedAt: null,
    };
  }

  const entry = await prisma.$transaction(async (tx) => {
    const persistedEntry = await tx.dailyEntry.upsert({
      where: {
        userId_entryDate: {
          entryDate: dateSlugToUtcDate(normalizedDraft.entryDate),
          userId,
        },
      },
      update: toEntryCreateOrUpdateInput(normalizedDraft, status),
      create: {
        ...toEntryCreateOrUpdateInput(normalizedDraft, status),
        userId,
      },
    });

    await tx.relaxItem.deleteMany({
      where: {
        dailyEntryId: persistedEntry.id,
      },
    });

    if (normalizedDraft.relaxItems.length > 0) {
      await tx.relaxItem.createMany({
        data: normalizedDraft.relaxItems.map((item, index) => ({
          dailyEntryId: persistedEntry.id,
          sortOrder: index,
          text: item,
        })),
      });
    }

    const tags = await syncDailyEntryTags(tx, userId, persistedEntry.id, normalizedDraft);

    return {
      persistedEntry,
      tags,
    };
  });

  return {
    entryId: entry.persistedEntry.id,
    relaxItems: normalizedDraft.relaxItems,
    status,
    tagSuggestions: await loadTagSuggestionsForUser(userId),
    tags: entry.tags,
    updatedAt: entry.persistedEntry.updatedAt.toISOString(),
  };
}

export async function uploadDailyEntryImagesForUser(
  userId: string,
  entryDate: string,
  images: StoredImage[],
) {
  if (!isValidDateSlug(entryDate)) {
    throw new Error(`Invalid entry date: ${entryDate}`);
  }

  if (images.length === 0) {
    throw new Error("Please choose at least one image before uploading.");
  }

  try {
    const entry = await prisma.$transaction(async (tx) => {
      const existingEntry = await tx.dailyEntry.findUnique({
        where: {
          userId_entryDate: {
            entryDate: dateSlugToUtcDate(entryDate),
            userId,
          },
        },
        include: {
          imageAttachments: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          relaxItems: true,
          _count: {
            select: {
              imageAttachments: true,
              tags: true,
            },
          },
        },
      });

      let dailyEntryId = existingEntry?.id ?? null;

      if (!dailyEntryId) {
        const emptyDraft = createEmptyDailyEntry(entryDate);
        const createdEntry = await tx.dailyEntry.create({
          data: {
            ...toEntryCreateOrUpdateInput(
              emptyDraft,
              inferDailyEntryStatus(emptyDraft, {
                imageCount: images.length,
              }),
            ),
            userId,
          },
        });

        dailyEntryId = createdEntry.id;
      }

      const nextSortOrder = existingEntry?.imageAttachments.length ?? 0;

      await tx.imageAttachment.createMany({
        data: images.map((image, index) => ({
          byteSize: image.byteSize,
          dailyEntryId,
          extension: image.extension,
          height: image.height,
          mimeType: image.mimeType,
          originalFilename: image.originalFilename,
          relativePath: image.relativePath,
          sortOrder: nextSortOrder + index,
          storedFilename: image.storedFilename,
          userId,
          width: image.width,
        })),
      });

      const syncedEntry = await syncDailyEntryStatus(tx, dailyEntryId);

      if (!syncedEntry) {
        throw new Error("The uploaded image entry could not be refreshed.");
      }

      return syncedEntry;
    });

    return {
      entryId: entry.id,
      imageAttachments: entry.imageAttachments.map(mapImageAttachment),
      status: statusToClient(entry.status),
      updatedAt: entry.updatedAt.toISOString(),
    };
  } catch (error) {
    await Promise.all(images.map((image) => removeStoredFile(image.relativePath)));
    throw error;
  }
}

export async function deleteDailyEntryImageForUser(userId: string, attachmentId: string) {
  const attachment = await prisma.imageAttachment.findFirst({
    where: {
      id: attachmentId,
      userId,
    },
    select: {
      dailyEntryId: true,
      id: true,
      relativePath: true,
    },
  });

  if (!attachment) {
    throw new Error("That image could not be found.");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.imageAttachment.delete({
      where: { id: attachment.id },
    });

    await normalizeImageAttachmentSortOrder(tx, attachment.dailyEntryId);

    const pruneResult = await pruneEmptyDailyEntryIfNeeded(tx, attachment.dailyEntryId);

    if (pruneResult.deleted) {
      return {
        deletedEntry: true as const,
      };
    }

    const syncedEntry = await syncDailyEntryStatus(tx, attachment.dailyEntryId);

    if (!syncedEntry) {
      throw new Error("The journal entry could not be refreshed after deleting that image.");
    }

    return {
      deletedEntry: false as const,
      entry: syncedEntry,
    };
  });

  await removeStoredFile(attachment.relativePath);

  if (result.deletedEntry) {
    return {
      entryDeleted: true as const,
      entryId: null,
      imageAttachments: [] as ImageAttachmentRecord[],
      status: "not_started" as DailyEntryStatus,
      updatedAt: null,
    };
  }

  return {
    entryDeleted: false as const,
    entryId: result.entry.id,
    imageAttachments: result.entry.imageAttachments.map(mapImageAttachment),
    status: statusToClient(result.entry.status),
    updatedAt: result.entry.updatedAt.toISOString(),
  };
}
