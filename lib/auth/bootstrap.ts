import { prisma } from "@/lib/prisma";

export async function hasExistingUser() {
  const userCount = await prisma.user.count();
  return userCount > 0;
}
