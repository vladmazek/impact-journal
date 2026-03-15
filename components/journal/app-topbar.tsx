"use client";

import { useRef } from "react";
import Link from "next/link";
import { LogOut, NotebookText, Settings2 } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { getMediaUrl } from "@/lib/media-url";
import { type SessionUser } from "@/lib/auth/session";
import { DateNavigation } from "@/components/journal/date-navigation";
import { WeekNavigation } from "@/components/journal/week-navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppTopbarProps = {
  activeView: "daily" | "settings" | "weekly";
  dailyHref: string;
  navigation?:
    | {
        currentDate: string;
        kind: "date";
        todayDate: string;
      }
    | {
        currentHref: string;
        isCurrentWeek: boolean;
        kind: "week";
        nextHref: string;
        previousHref: string;
      };
  settingsHref: string;
  subtitle: string;
  user: SessionUser;
  weekHref: string;
};

function initialsFromName(name: string | null | undefined) {
  const value = name?.trim();

  if (!value) {
    return "IJ";
  }

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

function viewLinkClass(isActive: boolean) {
  return isActive
    ? "rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
    : "rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-primary/20 hover:text-foreground";
}

export function AppTopbar({
  activeView,
  dailyHref,
  navigation,
  settingsHref,
  subtitle,
  user,
  weekHref,
}: AppTopbarProps) {
  const logoutFormRef = useRef<HTMLFormElement | null>(null);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <NotebookText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-xl leading-none text-foreground">Impact Journal</p>
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link className={viewLinkClass(activeView === "daily")} href={dailyHref}>
              Day
            </Link>
            <Link className={viewLinkClass(activeView === "weekly")} href={weekHref}>
              Week
            </Link>
            <Link className={viewLinkClass(activeView === "settings")} href={settingsHref}>
              Settings
            </Link>
          </div>

          {navigation?.kind === "date" ? (
            <DateNavigation
              currentDate={navigation.currentDate}
              todayDate={navigation.todayDate}
            />
          ) : null}
          {navigation?.kind === "week" ? (
            <WeekNavigation
              currentHref={navigation.currentHref}
              isCurrentWeek={navigation.isCurrentWeek}
              nextHref={navigation.nextHref}
              previousHref={navigation.previousHref}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle currentPreference={user.themePreference} persistPreference />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={`Open account menu for ${user.displayName ?? "Journal owner"}`}
                className="flex h-11 items-center gap-3 rounded-full border border-border/70 bg-card/90 px-2.5 pl-2 transition-colors hover:bg-accent/30"
                type="button"
              >
                <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary">
                  {user.avatarRelativePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`${user.displayName ?? "Journal owner"} avatar`}
                      className="h-full w-full object-cover"
                      src={getMediaUrl(user.avatarRelativePath)}
                    />
                  ) : (
                    initialsFromName(user.displayName)
                  )}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium text-foreground">
                    {user.displayName ?? "Journal owner"}
                  </span>
                  <span className="block text-xs text-muted-foreground">Private workspace</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <div className="px-3 pb-2 text-sm text-muted-foreground">{user.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={settingsHref}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Open settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={logoutAction} ref={logoutFormRef}>
                <DropdownMenuItem onSelect={() => logoutFormRef.current?.requestSubmit()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
