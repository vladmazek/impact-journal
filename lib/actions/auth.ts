"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { type AuthActionState } from "@/lib/actions/auth-state";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hasExistingUser } from "@/lib/auth/bootstrap";
import {
  clearUserSession,
  createUserSession,
  getSessionUser,
  updateSessionThemePreference,
} from "@/lib/auth/session";
import { saveUploadedImage, removeStoredFile } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { toThemeMode, toThemePreference, type ThemeMode } from "@/lib/theme";
import { isValidTimeZone } from "@/lib/date";

const loginSchema = z.object({
  email: z.string().trim().email("Use a valid email address."),
  password: z.string().min(8, "Enter the password you chose during setup."),
});

const setupSchema = z.object({
  displayName: z.string().trim().min(2, "Add the name you want to see in the journal."),
  email: z.string().trim().email("Use a valid email address."),
  password: z
    .string()
    .min(8, "Choose a password with at least 8 characters."),
  themePreference: z.enum(["light", "dark", "system"]),
  timezone: z
    .string()
    .trim()
    .min(1)
    .refine((value) => isValidTimeZone(value), "Use a valid timezone from this browser."),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function persistSession(user: {
  avatarRelativePath: string | null;
  displayName: string | null;
  email: string;
  id: string;
  themePreference: ThemeMode;
}) {
  await createUserSession({
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    themePreference: user.themePreference,
    avatarRelativePath: user.avatarRelativePath,
  });
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
) {
  const journalExists = await hasExistingUser();

  if (!journalExists) {
    redirect("/setup");
  }

  const parsedValues = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedValues.success) {
    return {
      error: parsedValues.error.issues[0]?.message ?? "Check your login details and try again.",
    };
  }

  const email = normalizeEmail(parsedValues.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      error: "That email does not match the journal owner.",
    };
  }

  const isValidPassword = await verifyPassword(
    user.passwordHash,
    parsedValues.data.password,
  );

  if (!isValidPassword) {
    return {
      error: "That password did not match. Try again.",
    };
  }

  await persistSession({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    themePreference: toThemeMode(user.themePreference),
    avatarRelativePath: user.avatarRelativePath,
  });

  redirect("/today");
}

export async function setupAction(
  _previousState: AuthActionState,
  formData: FormData,
) {
  const journalExists = await hasExistingUser();

  if (journalExists) {
    return {
      error: "This journal already has an owner. Sign in instead.",
    };
  }

  const parsedValues = setupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    themePreference: formData.get("themePreference"),
    timezone: formData.get("timezone"),
  });

  if (!parsedValues.success) {
    return {
      error: parsedValues.error.issues[0]?.message ?? "Fill out every field and try again.",
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
  let createdUser:
    | {
        avatarRelativePath: string | null;
        displayName: string | null;
        email: string;
        id: string;
      }
    | null = null;

  try {
    if (avatar instanceof File && avatar.size > 0) {
      storedAvatar = await saveUploadedImage(avatar, {
        bucket: "avatars",
        baseName: `${parsedValues.data.displayName}-avatar`,
      });
    }

    createdUser = await prisma.user.create({
      data: {
        displayName: parsedValues.data.displayName.trim(),
        email: normalizeEmail(parsedValues.data.email),
        passwordHash: await hashPassword(parsedValues.data.password),
        themePreference: toThemePreference(parsedValues.data.themePreference),
        timezone: parsedValues.data.timezone.trim(),
        avatarByteSize: storedAvatar?.byteSize,
        avatarExtension: storedAvatar?.extension,
        avatarMimeType: storedAvatar?.mimeType,
        avatarOriginalFilename: storedAvatar?.originalFilename,
        avatarRelativePath: storedAvatar?.relativePath,
        avatarStoredFilename: storedAvatar?.storedFilename,
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
      };
    }

    return {
      error: "The journal setup could not be saved. Please try again.",
    };
  }

  if (!createdUser) {
    return {
      error: "The journal setup could not be saved. Please try again.",
    };
  }

  await persistSession({
    id: createdUser.id,
    email: createdUser.email,
    displayName: createdUser.displayName,
    themePreference: parsedValues.data.themePreference,
    avatarRelativePath: createdUser.avatarRelativePath,
  });

  revalidatePath("/", "layout");
  redirect("/today");
}

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}

export async function updateThemePreferenceAction(theme: ThemeMode) {
  const session = await getSessionUser();

  if (!session) {
    return;
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        themePreference: toThemePreference(theme),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      await clearUserSession();
      redirect("/login");
    }

    throw error;
  }

  await updateSessionThemePreference(theme);
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/today");
}
