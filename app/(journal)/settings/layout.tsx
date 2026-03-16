import type { ReactNode } from "react";

import { AppTopbar } from "@/components/journal/app-topbar";
import { resolveCurrentIsoWeek, resolveTodayDateSlug } from "@/lib/date";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type SettingsLayoutProps = {
  children: ReactNode;
};

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await requireUserSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { timezone: true },
  });

  const timezone = user?.timezone ?? "America/New_York";
  const todayDate = resolveTodayDateSlug(new Date(), timezone);
  const currentWeek = resolveCurrentIsoWeek(new Date(), timezone);

  return (
    <div className="min-h-screen">
      <AppTopbar
        activeView="settings"
        brandHref={`/entry/${todayDate}`}
        dailyHref={`/entry/${todayDate}`}
        settingsHref="/settings"
        subtitle="Journal settings"
        user={session}
        weekHref={`/week/${currentWeek.isoYear}/${currentWeek.isoWeek}`}
      />
      {children}
    </div>
  );
}
