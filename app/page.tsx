import { redirect } from "next/navigation";

import { hasExistingUser } from "@/lib/auth/bootstrap";
import { getSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const [session, journalExists] = await Promise.all([
    getSessionUser(),
    hasExistingUser(),
  ]);

  if (session) {
    redirect("/today");
  }

  if (journalExists) {
    redirect("/login");
  }

  redirect("/setup");
}

