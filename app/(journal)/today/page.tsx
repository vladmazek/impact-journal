import { redirect } from "next/navigation";

import { requireUserSession } from "@/lib/auth/session";
import { resolveTodayDateSlug } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export default async function TodayPage() {
  const session = await requireUserSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });
  const todayDate = resolveTodayDateSlug(
    new Date(),
    user?.timezone ?? "America/New_York",
  );

  redirect(`/entry/${todayDate}`);
}
