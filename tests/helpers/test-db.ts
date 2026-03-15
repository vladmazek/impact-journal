import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { hashPassword } from "@/lib/auth/password";
import { toThemePreference, type ThemeMode } from "@/lib/theme";

export const TEST_OWNER = {
  displayName: "Test Owner",
  email: "owner@example.com",
  password: "super-secret-password",
  themePreference: "system" as ThemeMode,
  timezone: "America/New_York",
};

type CreateOwnerUserOverrides = Partial<{
  displayName: string;
  email: string;
  password: string;
  themePreference: ThemeMode;
  timezone: string;
}>;

export async function resetTestState() {
  await prisma.user.deleteMany();
  await mkdir(env.MEDIA_ROOT, { recursive: true });

  const mediaEntries = await readdir(env.MEDIA_ROOT, { withFileTypes: true });

  await Promise.all(
    mediaEntries.map((entry) =>
      rm(path.join(env.MEDIA_ROOT, entry.name), {
        force: true,
        recursive: true,
      }),
    ),
  );

  await mkdir(path.join(env.MEDIA_ROOT, "avatars"), { recursive: true });
  await mkdir(path.join(env.MEDIA_ROOT, "originals"), { recursive: true });
}

export async function createOwnerUser(overrides: CreateOwnerUserOverrides = {}) {
  const password = overrides.password ?? TEST_OWNER.password;

  const user = await prisma.user.create({
    data: {
      displayName: overrides.displayName ?? TEST_OWNER.displayName,
      email: overrides.email ?? TEST_OWNER.email,
      passwordHash: await hashPassword(password),
      themePreference: toThemePreference(
        overrides.themePreference ?? TEST_OWNER.themePreference,
      ),
      timezone: overrides.timezone ?? TEST_OWNER.timezone,
    },
  });

  return {
    password,
    user,
  };
}

export async function countDailyEntries() {
  return prisma.dailyEntry.count();
}

export async function countImageAttachments() {
  return prisma.imageAttachment.count();
}

export async function countWeeklyReflections() {
  return prisma.weeklyReflection.count();
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function findDailyEntryByDate(userId: string, entryDate: Date) {
  return prisma.dailyEntry.findUnique({
    where: {
      userId_entryDate: {
        entryDate,
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
          tag: true,
        },
      },
    },
  });
}

export async function findWeeklyReflectionByWeek(
  userId: string,
  isoYear: number,
  isoWeek: number,
) {
  return prisma.weeklyReflection.findUnique({
    where: {
      userId_isoYear_isoWeek: {
        isoWeek,
        isoYear,
        userId,
      },
    },
    include: {
      lifeAreaRatings: {
        orderBy: {
          areaKey: "asc",
        },
      },
    },
  });
}
