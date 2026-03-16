"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type SettingsActionState } from "@/lib/actions/settings-state";
import { hashPassword } from "@/lib/auth/password";
import { getSessionUser, refreshUserSessionFromDatabase } from "@/lib/auth/session";
import { parseLocationSelection } from "@/lib/location-search";
import { removeStoredFile, saveUploadedImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Add the name you want to see in the journal."),
  email: z.string().trim().email("Use a valid email address."),
  locationQuery: z.string().trim().optional(),
  locationSelection: z.string().optional(),
});

const passwordSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirm the new password."),
    newPassword: z.string().min(8, "Choose a password with at least 8 characters."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "The new password confirmation did not match.",
    path: ["confirmPassword"],
  });

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function requireSettingsSession() {
  const session = await getSessionUser();

  if (!session) {
    return null;
  }

  return session;
}

export async function updateProfileAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireSettingsSession();

  if (!session) {
    return {
      error: "Your session expired. Sign in again to update settings.",
      success: null,
    };
  }

  const parsedValues = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    locationQuery: formData.get("locationQuery"),
    locationSelection: formData.get("locationSelection"),
  });

  if (!parsedValues.success) {
    return {
      error:
        parsedValues.error.issues[0]?.message ?? "Unable to update your account settings.",
      success: null,
    };
  }

  let selectedLocation = null;
  const normalizedLocationQuery = parsedValues.data.locationQuery?.trim() ?? "";

  try {
    selectedLocation = parseLocationSelection(parsedValues.data.locationSelection);
  } catch {
    return {
      error: "Choose a location from the suggestions so the journal can keep local time right.",
      success: null,
    };
  }

  if (normalizedLocationQuery.length > 0 && !selectedLocation) {
    return {
      error: "Choose a location from the suggestions so the journal can keep local time right.",
      success: null,
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      avatarByteSize: true,
      avatarExtension: true,
      avatarMimeType: true,
      avatarOriginalFilename: true,
      avatarRelativePath: true,
      avatarStoredFilename: true,
      id: true,
      locationCity: true,
      locationCountry: true,
      locationLabel: true,
      locationLatitude: true,
      locationLongitude: true,
      locationRegion: true,
      timezone: true,
    },
  });

  if (!currentUser) {
    return {
      error: "That account could not be found anymore. Sign in again to continue.",
      success: null,
    };
  }

  const avatar = formData.get("avatar");
  let storedAvatar:
    | {
        byteSize: number;
        extension: string;
        mimeType: string;
        originalFilename: string;
        relativePath: string;
        storedFilename: string;
      }
    | null = null;

  try {
    if (avatar instanceof File && avatar.size > 0) {
      storedAvatar = await saveUploadedImage(avatar, {
        baseName: `${parsedValues.data.displayName}-avatar`,
        bucket: "avatars",
      });
    }

    const nextLocationCity =
      selectedLocation?.city ??
      (normalizedLocationQuery.length === 0 ? currentUser.locationCity : null);
    const nextLocationCountry =
      selectedLocation?.country ??
      (normalizedLocationQuery.length === 0 ? currentUser.locationCountry : null);
    const nextLocationLabel =
      selectedLocation?.label ??
      (normalizedLocationQuery.length === 0 ? currentUser.locationLabel : null);
    const nextLocationLatitude =
      selectedLocation?.latitude ??
      (normalizedLocationQuery.length === 0 ? currentUser.locationLatitude : null);
    const nextLocationLongitude =
      selectedLocation?.longitude ??
      (normalizedLocationQuery.length === 0 ? currentUser.locationLongitude : null);
    const nextLocationRegion =
      selectedLocation?.region ??
      (normalizedLocationQuery.length === 0 ? currentUser.locationRegion : null);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        avatarByteSize: storedAvatar?.byteSize ?? undefined,
        avatarExtension: storedAvatar?.extension ?? undefined,
        avatarMimeType: storedAvatar?.mimeType ?? undefined,
        avatarOriginalFilename: storedAvatar?.originalFilename ?? undefined,
        avatarRelativePath: storedAvatar?.relativePath ?? undefined,
        avatarStoredFilename: storedAvatar?.storedFilename ?? undefined,
        displayName: parsedValues.data.displayName.trim(),
        email: normalizeEmail(parsedValues.data.email),
        locationCity: nextLocationCity,
        locationCountry: nextLocationCountry,
        locationLabel: nextLocationLabel,
        locationLatitude: nextLocationLatitude,
        locationLongitude: nextLocationLongitude,
        locationRegion: nextLocationRegion,
        timezone: selectedLocation?.timezone ?? currentUser.timezone ?? "America/New_York",
      },
    });
  } catch (error) {
    if (storedAvatar) {
      await removeStoredFile(storedAvatar.relativePath);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "That email is already in use for this journal.",
        success: null,
      };
    }

    return {
      error: "Your account settings could not be updated. Please try again.",
      success: null,
    };
  }

  if (storedAvatar && currentUser.avatarRelativePath) {
    await removeStoredFile(currentUser.avatarRelativePath);
  }

  await refreshUserSessionFromDatabase(session.userId);
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/today");

  return {
    error: null,
    success: "Account settings updated.",
  };
}

export async function updatePasswordAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireSettingsSession();

  if (!session) {
    return {
      error: "Your session expired. Sign in again to update settings.",
      success: null,
    };
  }

  const parsedValues = passwordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsedValues.success) {
    return {
      error:
        parsedValues.error.issues[0]?.message ?? "Unable to update your password right now.",
      success: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      error: "That account could not be found anymore. Sign in again to continue.",
      success: null,
    };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: await hashPassword(parsedValues.data.newPassword),
    },
  });

  await refreshUserSessionFromDatabase(session.userId);
  revalidatePath("/settings");

  return {
    error: null,
    success: "Password updated.",
  };
}
