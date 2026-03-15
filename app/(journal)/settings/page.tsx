import { PasswordSettingsForm } from "@/components/settings/password-settings-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { toThemeMode } from "@/lib/theme";

export default async function SettingsPage() {
  const session = await requireUserSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      avatarRelativePath: true,
      displayName: true,
      email: true,
      themePreference: true,
      timezone: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,rgba(8,15,30,0.95),rgba(12,20,37,0.88))] sm:p-8">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary/75">
              Settings
            </p>
            <div className="space-y-3">
              <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                Keep the private journal grounded.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Update the single-owner account, keep the timezone honest, and change the password
                without turning the app into an admin dashboard.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/60">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">Account</p>
            <CardTitle>Owner details</CardTitle>
            <CardDescription>
              Display name, login email, timezone, and avatar for this single private workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileSettingsForm
              avatarRelativePath={user.avatarRelativePath}
              displayName={user.displayName}
              email={user.email}
              timezone={user.timezone}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/60">
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">Security</p>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change the journal password while keeping the current session secure and active.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <PasswordSettingsForm />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">Appearance</p>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Light and dark mode stay first-class. The preference persists with the owner account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ThemeToggle
              currentPreference={toThemeMode(user.themePreference)}
              persistPreference
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Choose light, dark, or system and the preference will follow the owner account.
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">Workspace</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>.
            Everything else in the app remains private to this one owner account.
          </p>
        </Card>
      </aside>
    </main>
  );
}
