import { notFound } from "next/navigation";

import { JournalEntryPage } from "@/components/journal/journal-entry-page";
import { requireUserSession } from "@/lib/auth/session";
import { isValidDateSlug, resolveTodayDateSlug } from "@/lib/date";
import { loadDailyEntryForUser } from "@/lib/journal/daily-entry";
import { prisma } from "@/lib/prisma";

type EntryPageProps = {
  params: {
    date: string;
  };
};

export default async function EntryPage({ params }: EntryPageProps) {
  if (!isValidDateSlug(params.date)) {
    notFound();
  }

  const session = await requireUserSession();
  const [entry, user] = await Promise.all([
    loadDailyEntryForUser(session.userId, params.date),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { timezone: true },
    }),
  ]);

  const todayDate = resolveTodayDateSlug(
    new Date(),
    user?.timezone ?? "America/New_York",
  );

  return (
    <JournalEntryPage
      entry={entry}
      key={`${entry.entryDate}:${entry.updatedAt ?? "blank"}`}
      ownerName={session.displayName}
      todayDate={todayDate}
    />
  );
}
