import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { toThemeMode, type ThemeMode } from "@/lib/theme";

const COOKIE_NAME = "impact-journal-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const sessionSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  themePreference: z.enum(["light", "dark", "system"]),
  avatarRelativePath: z.string().nullable().optional(),
});

export type SessionUser = z.infer<typeof sessionSchema>;

function getSecretKey() {
  return new TextEncoder().encode(env.AUTH_COOKIE_SECRET);
}

export async function createUserSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearUserSession() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionUser() {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return sessionSchema.parse(payload);
  } catch {
    await clearUserSession();
    return null;
  }
}

export async function requireUserSession() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function updateSessionThemePreference(themePreference: ThemeMode) {
  const session = await getSessionUser();

  if (!session) {
    return;
  }

  await createUserSession({
    ...session,
    themePreference,
  });
}

export async function refreshUserSessionFromDatabase(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatarRelativePath: true,
      displayName: true,
      email: true,
      id: true,
      themePreference: true,
    },
  });

  if (!user) {
    await clearUserSession();
    return;
  }

  await createUserSession({
    avatarRelativePath: user.avatarRelativePath,
    displayName: user.displayName,
    email: user.email,
    themePreference: toThemeMode(user.themePreference),
    userId: user.id,
  });
}
