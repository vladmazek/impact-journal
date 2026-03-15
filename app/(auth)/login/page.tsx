import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasExistingUser } from "@/lib/auth/bootstrap";
import { getSessionUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const [session, journalExists] = await Promise.all([
    getSessionUser(),
    hasExistingUser(),
  ]);

  if (session) {
    redirect("/today");
  }

  if (!journalExists) {
    redirect("/setup");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_460px]">
        <section className="rounded-[36px] border border-border/60 bg-card/80 p-8 shadow-journal backdrop-blur sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70">
            Private by design
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-tight text-balance text-foreground">
            Return to the page you left open.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Impact Journal is a single-owner space. Sign in to reach today&apos;s page,
            your stored images, and the journal shell that will hold the full daily flow.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Card className="bg-background/80 shadow-none">
              <CardHeader>
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Mounted media</CardTitle>
                <CardDescription>
                  Images stay on your host volume, not inside the repo or a cloud bucket.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/80 shadow-none">
              <CardHeader>
                <LockKeyhole className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Signed session</CardTitle>
                <CardDescription>
                  Credentials auth and HTTP-only cookies protect every journal route.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Setting up a brand-new journal instead?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/setup">
              Go to first-run setup
            </Link>
            .
          </p>
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="bg-background/60 pb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
              Login
            </p>
            <CardTitle>Open your private workspace</CardTitle>
            <CardDescription>
              Use the same email and password chosen when the journal was first initialized.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

