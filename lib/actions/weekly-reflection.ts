"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserSession } from "@/lib/auth/session";
import { isValidIsoWeekParts } from "@/lib/date";
import { saveWeeklyReflectionForUser } from "@/lib/journal/weekly-reflection";
import {
  normalizeWeeklyReflectionDraft,
  type WeeklyReflectionDraft,
} from "@/lib/journal/weekly-reflection-shared";

const lifeAreaRatingSchema = z.object({
  areaKey: z.enum([
    "work",
    "family_home",
    "health",
    "stress",
    "personal_fulfillment",
  ]),
  note: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
});

const weeklyReflectionSchema = z.object({
  feltOff: z.string(),
  hardMoments: z.string(),
  isoWeek: z.number().int(),
  isoYear: z.number().int(),
  lifeAreaRatings: z.array(lifeAreaRatingSchema).length(5),
  nextWeekIntention: z.string(),
  overallMoodEmoji: z.string().nullable(),
  overallMoodLabel: z.string().nullable(),
  overallMoodValue: z.string().nullable(),
  summaryContext: z.string(),
  wins: z.string(),
});

export async function saveWeeklyReflectionAction(input: WeeklyReflectionDraft) {
  const session = await requireUserSession();
  const parsedInput = weeklyReflectionSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(
      parsedInput.error.issues[0]?.message ?? "Unable to save this weekly reflection.",
    );
  }

  if (!isValidIsoWeekParts(parsedInput.data.isoYear, parsedInput.data.isoWeek)) {
    throw new Error("The requested week is invalid.");
  }

  const normalizedDraft = normalizeWeeklyReflectionDraft(parsedInput.data);
  const result = await saveWeeklyReflectionForUser(session.userId, normalizedDraft);

  revalidatePath(`/week/${normalizedDraft.isoYear}/${normalizedDraft.isoWeek}`);
  revalidatePath("/today");

  return result;
}
