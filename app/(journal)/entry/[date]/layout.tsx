import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/journal/app-topbar";
import { JournalRuntimeProvider } from "@/components/journal/journal-runtime";
import { requireUserSession } from "@/lib/auth/session";
import {
  formatLongDateFromSlug,
  getIsoWeekPartsFromDateSlug,
  isValidDateSlug,
  resolveTodayDateSlug,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";

type EntryLayoutProps = {
  children: ReactNode;
  params: {
    date: string;
  };
};

export default async function EntryLayout({
  children,
  params,
}: EntryLayoutProps) {
  if (!isValidDateSlug(params.date)) {
    notFound();
  }

  const session = await requireUserSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });

  const todayDate = resolveTodayDateSlug(
    new Date(),
    user?.timezone ?? "America/New_York",
  );
  const viewedWeek = getIsoWeekPartsFromDateSlug(params.date);

  return (
    <JournalRuntimeProvider currentDate={params.date}>
      <div className="min-h-screen">
        <AppTopbar
          activeView="daily"
          dailyHref={`/entry/${params.date}`}
          navigation={{
            currentDate: params.date,
            kind: "date",
            todayDate,
          }}
          settingsHref="/settings"
          subtitle={formatLongDateFromSlug(params.date)}
          user={session}
          weekHref={`/week/${viewedWeek.isoYear}/${viewedWeek.isoWeek}`}
        />
        {children}
      </div>
    </JournalRuntimeProvider>
  );
}
