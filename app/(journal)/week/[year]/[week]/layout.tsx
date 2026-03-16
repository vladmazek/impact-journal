import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/journal/app-topbar";
import { JournalRuntimeProvider } from "@/components/journal/journal-runtime";
import {
  formatIsoWeekLabel,
  isValidIsoWeekParts,
  resolveCurrentIsoWeek,
  resolveTodayDateSlug,
  shiftIsoWeek,
} from "@/lib/date";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type WeekLayoutProps = {
  children: ReactNode;
  params: {
    week: string;
    year: string;
  };
};

export default async function WeekLayout({ children, params }: WeekLayoutProps) {
  const isoYear = Number(params.year);
  const isoWeek = Number(params.week);

  if (!isValidIsoWeekParts(isoYear, isoWeek)) {
    notFound();
  }

  const session = await requireUserSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });

  const timezone = user?.timezone ?? "America/New_York";
  const todayDate = resolveTodayDateSlug(new Date(), timezone);
  const currentWeek = resolveCurrentIsoWeek(new Date(), timezone);
  const previousWeek = shiftIsoWeek(isoYear, isoWeek, -1);
  const nextWeek = shiftIsoWeek(isoYear, isoWeek, 1);

  return (
    <JournalRuntimeProvider currentHref={`/week/${isoYear}/${isoWeek}`}>
      <div className="min-h-screen">
        <AppTopbar
          activeView="weekly"
          brandHref={`/entry/${todayDate}`}
          dailyHref={`/entry/${todayDate}`}
          navigation={{
            currentHref: `/week/${currentWeek.isoYear}/${currentWeek.isoWeek}`,
            isCurrentWeek:
              currentWeek.isoYear === isoYear && currentWeek.isoWeek === isoWeek,
            kind: "week",
            nextHref: `/week/${nextWeek.isoYear}/${nextWeek.isoWeek}`,
            previousHref: `/week/${previousWeek.isoYear}/${previousWeek.isoWeek}`,
          }}
          settingsHref="/settings"
          subtitle={formatIsoWeekLabel(isoYear, isoWeek)}
          user={session}
          weekHref={`/week/${isoYear}/${isoWeek}`}
        />
        {children}
      </div>
    </JournalRuntimeProvider>
  );
}
