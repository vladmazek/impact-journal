"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type SettingsActionState } from "@/lib/actions/settings-state";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSessionUser, refreshUserSessionFromDatabase } from "@/lib/auth/session";
import { isValidTimeZone } from "@/lib/date";
import { removeStoredFile, saveUploadedImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Add the name you want to see in the journal."),
  email: z.string().trim().email("Use a valid email address."),
  timezone: z
    .string()
    .trim()
    .min(1, "Add a timezone like America/New_York.")
    .refine((value) => isValidTimeZone(value), "Use a valid IANA timezone like America/New_York."),
});

const passwordSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirm the new password."),
    currentPassword: z.string().min(8, "Enter your current password."),
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
    timezone: formData.get("timezone"),
  });

  if (!parsedValues.success) {
    return {
      error:
        parsedValues.error.issues[0]?.message ?? "Unable to update your account settings.",
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
        timezone: parsedValues.data.timezone.trim(),
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
    currentPassword: formData.get("currentPassword"),
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
      passwordHash: true,
    },
  });

  if (!user) {
    return {
      error: "That account could not be found anymore. Sign in again to continue.",
      success: null,
    };
  }

  const isValidPassword = await verifyPassword(
    user.passwordHash,
    parsedValues.data.currentPassword,
  );

  if (!isValidPassword) {
    return {
      error: "That current password did not match.",
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
