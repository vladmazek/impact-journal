"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserSession } from "@/lib/auth/session";
import { getIsoWeekPartsFromDateSlug, isValidDateSlug } from "@/lib/date";
import { saveDailyEntryForUser } from "@/lib/journal/daily-entry";
import {
  normalizeDailyEntryDraft,
  type DailyEntryDraft,
} from "@/lib/journal/daily-entry-shared";

const dailyEntrySchema = z.object({
  affirmation: z.string(),
  dailyCapture: z.string(),
  entryDate: z.string(),
  eveningGood1: z.string(),
  eveningGood2: z.string(),
  eveningGood3: z.string(),
  gratitude1: z.string(),
  gratitude2: z.string(),
  gratitude3: z.string(),
  improveTomorrow: z.string(),
  manualTagSlugs: z.array(z.string()).max(16),
  moodEmoji: z.string().nullable(),
  moodLabel: z.string().nullable(),
  moodValue: z.string().nullable(),
  relaxItems: z.array(z.string()).max(5),
  todayGreat: z.string(),
});

export async function saveDailyEntryAction(input: DailyEntryDraft) {
  const session = await requireUserSession();
  const parsedInput = dailyEntrySchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Unable to save this entry.");
  }

  if (!isValidDateSlug(parsedInput.data.entryDate)) {
    throw new Error("The requested journal date is invalid.");
  }

  const normalizedDraft = normalizeDailyEntryDraft(parsedInput.data);
  const result = await saveDailyEntryForUser(session.userId, normalizedDraft);
  const weeklyRoute = getIsoWeekPartsFromDateSlug(normalizedDraft.entryDate);

  revalidatePath(`/entry/${normalizedDraft.entryDate}`);
  revalidatePath("/today");
  revalidatePath(`/week/${weeklyRoute.isoYear}/${weeklyRoute.isoWeek}`);

  return result;
}
