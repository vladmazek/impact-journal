import { notFound } from "next/navigation";

import { JournalEntryPage } from "@/components/journal/journal-entry-page";
import { requireUserSession } from "@/lib/auth/session";
import {
  isValidDateSlug,
  resolveDailyPromptSection,
  resolveTodayDateSlug,
} from "@/lib/date";
import { loadCalendarNavigationMonthForUser } from "@/lib/journal/calendar-navigation";
import { loadDailyEntryForUser } from "@/lib/journal/daily-entry";
import { pickRandomMotivationalQuote } from "@/lib/motivational-quotes";
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

  const timezone = user?.timezone ?? "America/New_York";
  const now = new Date();
  const todayDate = resolveTodayDateSlug(now, timezone);
  const preferredPromptSection = resolveDailyPromptSection(now, timezone);
  const motivationalQuote = pickRandomMotivationalQuote();
  const calendarNavigation = await loadCalendarNavigationMonthForUser(
    session.userId,
    params.date,
    todayDate,
  );

  return (
    <JournalEntryPage
      calendarNavigation={calendarNavigation}
      entry={entry}
      motivationalQuote={motivationalQuote}
      preferredPromptSection={preferredPromptSection}
      todayDate={todayDate}
      userTimeZone={timezone}
    />
  );
}
