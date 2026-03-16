import { notFound } from "next/navigation";

import { WeeklyReflectionPage } from "@/components/journal/weekly-reflection-page";
import { requireUserSession } from "@/lib/auth/session";
import { isValidIsoWeekParts } from "@/lib/date";
import { loadWeeklyReflectionForUser } from "@/lib/journal/weekly-reflection";

type WeekPageProps = {
  params: {
    week: string;
    year: string;
  };
};

export default async function WeekPage({ params }: WeekPageProps) {
  const isoYear = Number(params.year);
  const isoWeek = Number(params.week);

  if (!isValidIsoWeekParts(isoYear, isoWeek)) {
    notFound();
  }

  const session = await requireUserSession();
  const reflection = await loadWeeklyReflectionForUser(session.userId, isoYear, isoWeek);

  return (
    <WeeklyReflectionPage
      reflection={reflection}
    />
  );
}
