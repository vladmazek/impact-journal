"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

import { initialSettingsActionState } from "@/lib/actions/settings-state";
import { updateProfileAction } from "@/lib/actions/settings";
import { getMediaUrl } from "@/lib/media-url";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/submit-button";

type ProfileSettingsFormProps = {
  avatarRelativePath: string | null;
  displayName: string | null;
  email: string;
  timezone: string;
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

export function ProfileSettingsForm({
  avatarRelativePath,
  displayName,
  email,
  timezone,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateProfileAction, initialSettingsActionState);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [timezoneValue, setTimezoneValue] = useState(timezone);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) {
      return null;
    }

    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!timezone && browserTimeZone) {
      setTimezoneValue(browserTimeZone);
    }
  }, [timezone]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="settings-display-name">Name</Label>
          <Input
            defaultValue={displayName ?? ""}
            id="settings-display-name"
            name="displayName"
            placeholder="The name on the journal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            autoComplete="email"
            defaultValue={email}
            id="settings-email"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="settings-timezone">Timezone</Label>
            <Button
              className="rounded-full"
              onClick={() =>
                setTimezoneValue(Intl.DateTimeFormat().resolvedOptions().timeZone)
              }
              type="button"
              variant="ghost"
            >
              Use browser timezone
            </Button>
          </div>
          <Input
            id="settings-timezone"
            name="timezone"
            onChange={(event) => setTimezoneValue(event.currentTarget.value)}
            placeholder="America/New_York"
            value={timezoneValue}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="settings-avatar">Avatar</Label>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Optional
          </span>
        </div>
        <label
          className="group flex cursor-pointer items-center gap-4 rounded-[28px] border border-dashed border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-accent/20"
          htmlFor="settings-avatar"
        >
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-border/80 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            {avatarPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Avatar preview"
                className="h-full w-full object-cover"
                src={avatarPreviewUrl}
              />
            ) : avatarRelativePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${displayName ?? "Journal owner"} avatar`}
                className="h-full w-full object-cover"
                src={getMediaUrl(avatarRelativePath)}
              />
            ) : (
              <span className="font-serif text-2xl text-primary/70">
                {initialsFromName(displayName)}
              </span>
            )}
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              Replace the current avatar
            </span>
            <span className="block text-sm text-muted-foreground">
              JPEG, PNG, WEBP, or HEIC. Stored privately on the mounted media path.
            </span>
          </span>
        </label>
        <Input
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="file:mr-4 file:rounded-full file:border file:border-border/70 file:px-4 file:py-2 file:text-sm file:font-medium"
          id="settings-avatar"
          name="avatar"
          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <SubmitButton
        className="w-full"
        idleLabel="Save account settings"
        pendingLabel="Saving account settings"
        size="lg"
      />
    </form>
  );
}
