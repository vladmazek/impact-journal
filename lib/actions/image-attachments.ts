"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserSession } from "@/lib/auth/session";
import { getIsoWeekPartsFromDateSlug, isValidDateSlug } from "@/lib/date";
import {
  deleteDailyEntryImageForUser,
  uploadDailyEntryImagesForUser,
} from "@/lib/journal/daily-entry";
import {
  removeStoredFile,
  saveUploadedImage,
  type StoredImage,
} from "@/lib/media";

const deleteImageSchema = z.object({
  attachmentId: z.string().min(1, "The image could not be identified."),
  entryDate: z.string().min(1, "The journal date is required."),
});

export async function uploadEntryImagesAction(formData: FormData) {
  const session = await requireUserSession();
  const entryDate = String(formData.get("entryDate") ?? "");

  if (!isValidDateSlug(entryDate)) {
    throw new Error("The requested journal date is invalid.");
  }

  const uploads = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (uploads.length === 0) {
    throw new Error("Please choose at least one image before uploading.");
  }

  const storedImages: StoredImage[] = [];

  try {
    for (const upload of uploads) {
      const storedImage = await saveUploadedImage(upload, {
        bucket: "originals",
        baseName: upload.name,
        dateSlug: entryDate,
      });

      storedImages.push(storedImage);
    }

    const result = await uploadDailyEntryImagesForUser(
      session.userId,
      entryDate,
      storedImages,
    );
    const weeklyRoute = getIsoWeekPartsFromDateSlug(entryDate);

    revalidatePath(`/entry/${entryDate}`);
    revalidatePath("/today");
    revalidatePath(`/week/${weeklyRoute.isoYear}/${weeklyRoute.isoWeek}`);

    return result;
  } catch (error) {
    await Promise.all(storedImages.map((image) => removeStoredFile(image.relativePath)));
    throw error;
  }
}

export async function deleteEntryImageAction(input: {
  attachmentId: string;
  entryDate: string;
}) {
  const session = await requireUserSession();
  const parsedInput = deleteImageSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Unable to delete that image.");
  }

  if (!isValidDateSlug(parsedInput.data.entryDate)) {
    throw new Error("The requested journal date is invalid.");
  }

  const result = await deleteDailyEntryImageForUser(
    session.userId,
    parsedInput.data.attachmentId,
  );
  const weeklyRoute = getIsoWeekPartsFromDateSlug(parsedInput.data.entryDate);

  revalidatePath(`/entry/${parsedInput.data.entryDate}`);
  revalidatePath("/today");
  revalidatePath(`/week/${weeklyRoute.isoYear}/${weeklyRoute.isoWeek}`);

  return result;
}
