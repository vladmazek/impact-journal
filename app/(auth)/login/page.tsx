import { redirect } from "next/navigation";

import backgroundImage from "@/background.png";
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
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundPosition: "center center",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.26),transparent_34%),linear-gradient(180deg,rgba(246,242,233,0.26),rgba(246,242,233,0.08)_30%,rgba(238,232,219,0.42)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.16),transparent_36%),linear-gradient(180deg,rgba(6,11,24,0.32),rgba(6,11,24,0.1)_28%,rgba(6,11,24,0.6)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,243,0.16),rgba(250,248,243,0.04)_18%,transparent_42%,transparent_60%,rgba(250,248,243,0.08)_82%,rgba(250,248,243,0.18)_100%)] dark:bg-[linear-gradient(90deg,rgba(2,6,23,0.44),rgba(2,6,23,0.12)_18%,transparent_42%,transparent_60%,rgba(2,6,23,0.18)_82%,rgba(2,6,23,0.46)_100%)]"
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-[640px] overflow-hidden !rounded-[36px] !border-white/35 !bg-[linear-gradient(145deg,rgba(255,250,244,0.76),rgba(255,250,244,0.54))] shadow-[0_38px_100px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:!border-white/10 dark:!bg-[linear-gradient(145deg,rgba(6,11,24,0.8),rgba(6,11,24,0.56))] dark:shadow-[0_40px_110px_rgba(2,6,23,0.46)]">
          <CardHeader className="gap-4 p-8 pb-4 sm:p-10 sm:pb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
              Login
            </p>
            <CardTitle className="text-4xl leading-tight text-balance sm:text-5xl">
              Open your private workspace
            </CardTitle>
            <CardDescription className="max-w-xl text-base leading-8 sm:text-lg">
              Use the same email and password chosen when the journal was first initialized.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-3 sm:px-10 sm:pb-10">
            <LoginForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
