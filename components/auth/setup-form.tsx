"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";

import { initialAuthActionState } from "@/lib/actions/auth-state";
import { setupAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

const themeOptions = [
  {
    value: "light",
    title: "Light",
    description: "Paper-bright and distraction-light.",
  },
  {
    value: "dark",
    title: "Dark",
    description: "Muted contrast for late-night pages.",
  },
  {
    value: "system",
    title: "System",
    description: "Follow this device automatically.",
  },
] as const;

export function SetupForm() {
  const [state, formAction] = useFormState(setupAction, initialAuthActionState);
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">(
    "system",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [timezone, setTimezone] = useState("America/New_York");

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) {
      return null;
    }

    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (browserTimeZone) {
      setTimezone(browserTimeZone);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  return (
    <form action={formAction} className="space-y-7">
      <input name="timezone" type="hidden" value={timezone} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" name="displayName" placeholder="The name on the cover" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete="new-password"
            id="password"
            name="password"
            placeholder="Choose a strong password"
            type="password"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="avatar">Avatar</Label>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Optional
          </span>
        </div>
        <label
          className="group flex cursor-pointer items-center gap-4 rounded-[28px] border border-dashed border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-accent/20"
          htmlFor="avatar"
        >
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-border/80 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            {avatarPreviewUrl ? (
              <Image
                alt="Avatar preview"
                className="h-full w-full object-cover"
                fill
                sizes="64px"
                src={avatarPreviewUrl}
                unoptimized
              />
            ) : (
              <span className="font-serif text-2xl text-primary/70">IJ</span>
            )}
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              Choose a personal cover image
            </span>
            <span className="block text-sm text-muted-foreground">
              JPEG, PNG, WEBP, or HEIC. Stored privately on your mounted media volume.
            </span>
          </span>
        </label>
        <Input
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="file:mr-4 file:rounded-full file:border file:border-border/70 file:px-4 file:py-2 file:text-sm file:font-medium"
          id="avatar"
          name="avatar"
          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </div>

      <div className="space-y-3">
        <Label>Theme</Label>
        <input name="themePreference" type="hidden" value={themePreference} />
        <div className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => (
            <button
              className={cn(
                "rounded-[26px] border px-4 py-4 text-left transition-all",
                themePreference === option.value
                  ? "border-primary/50 bg-primary/10 shadow-sm"
                  : "border-border/70 bg-background/70 hover:border-primary/30 hover:bg-accent/20",
              )}
              key={option.value}
              onClick={() => setThemePreference(option.value)}
              type="button"
            >
              <span className="mb-1 block font-medium text-foreground">
                {option.title}
              </span>
              <span className="block text-sm text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <SubmitButton
        className="w-full"
        idleLabel="Create private journal"
        pendingLabel="Creating journal"
        size="lg"
      />
    </form>
  );
}
