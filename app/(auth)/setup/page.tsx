import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, FolderHeart, MoonStar } from "lucide-react";

import { SetupForm } from "@/components/auth/setup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasExistingUser } from "@/lib/auth/bootstrap";
import { getSessionUser } from "@/lib/auth/session";

export default async function SetupPage() {
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="rounded-[36px] border border-border/60 bg-card/80 p-8 shadow-journal backdrop-blur sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70">
            First-run setup
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-tight text-balance text-foreground">
            Create the owner account for this private journal.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            This setup happens only once. After you create the owner account, the app switches
            to login-only mode and every journal route stays protected behind credentials.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card className="bg-background/80 shadow-none">
              <CardHeader>
                <BadgeCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">One owner</CardTitle>
                <CardDescription>
                  The product is intentionally single-user from day one.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/80 shadow-none">
              <CardHeader>
                <FolderHeart className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Real storage</CardTitle>
                <CardDescription>
                  Avatar and journal images both save to the mounted host media path.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/80 shadow-none">
              <CardHeader>
                <MoonStar className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Theme memory</CardTitle>
                <CardDescription>
                  Choose light, dark, or system and keep that preference attached to the account.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Already initialized this journal?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/login">
              Go to login
            </Link>
            .
          </p>
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="bg-background/60 pb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
              Owner details
            </p>
            <CardTitle>Initialize the journal</CardTitle>
            <CardDescription>
              Name the journal owner, choose the login credentials, and optionally add an avatar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SetupForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

