"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

import { initialSettingsActionState } from "@/lib/actions/settings-state";
import { updateProfileAction } from "@/lib/actions/settings";
import {
  locationOptionSchema,
  serializeLocationSelection,
  type LocationOption,
} from "@/lib/location-search";
import { getMediaUrl } from "@/lib/media-url";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

type ProfileSettingsFormProps = {
  avatarRelativePath: string | null;
  displayName: string | null;
  email: string;
  locationCity: string | null;
  locationCountry: string | null;
  locationLabel: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationRegion: string | null;
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
  locationCity,
  locationCountry,
  locationLabel,
  locationLatitude,
  locationLongitude,
  locationRegion,
  timezone,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateProfileAction, initialSettingsActionState);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [locationQuery, setLocationQuery] = useState(locationLabel ?? "");
  const [locationResults, setLocationResults] = useState<LocationOption[]>([]);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isLocationListVisible, setIsLocationListVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(() => {
    if (
      !locationCity ||
      !locationCountry ||
      !locationLabel ||
      locationLatitude === null ||
      locationLongitude === null
    ) {
      return null;
    }

    const parsedLocation = locationOptionSchema.safeParse({
      city: locationCity,
      country: locationCountry,
      label: locationLabel,
      latitude: locationLatitude,
      longitude: locationLongitude,
      region: locationRegion,
      timezone,
    });

    return parsedLocation.success ? parsedLocation.data : null;
  });
  const locationRequestIdRef = useRef(0);

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
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  useEffect(() => {
    const trimmedQuery = locationQuery.trim();

    if (trimmedQuery.length < 2 || trimmedQuery === selectedLocation?.label) {
      setLocationResults([]);
      setLocationSearchError(null);
      setIsSearchingLocations(false);
      return;
    }

    const currentRequestId = locationRequestIdRef.current + 1;
    locationRequestIdRef.current = currentRequestId;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingLocations(true);

      try {
        const response = await fetch(`/api/location-search?q=${encodeURIComponent(trimmedQuery)}`);

        if (!response.ok) {
          throw new Error("Unable to load locations.");
        }

        const payload = await response.json();

        if (locationRequestIdRef.current !== currentRequestId) {
          return;
        }

        const parsedResults = locationOptionSchema.array().safeParse(payload.results);
        setLocationResults(parsedResults.success ? parsedResults.data : []);
        setLocationSearchError(null);
      } catch {
        if (locationRequestIdRef.current !== currentRequestId) {
          return;
        }

        setLocationResults([]);
        setLocationSearchError("Location suggestions are unavailable right now.");
      } finally {
        if (locationRequestIdRef.current === currentRequestId) {
          setIsSearchingLocations(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [locationQuery, selectedLocation?.label]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
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
          <Label htmlFor="settings-location">Home location</Label>
          <Input
            autoComplete="off"
            id="settings-location"
            onBlur={() => {
              window.setTimeout(() => {
                setIsLocationListVisible(false);
              }, 120);
            }}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setLocationQuery(nextValue);
              setLocationSearchError(null);

              if (nextValue !== selectedLocation?.label) {
                setSelectedLocation(null);
              }
            }}
            onFocus={() => setIsLocationListVisible(true)}
            placeholder="Search city, state, country"
            value={locationQuery}
          />
          <input
            name="locationQuery"
            type="hidden"
            value={locationQuery}
          />
          <input
            name="locationSelection"
            type="hidden"
            value={selectedLocation ? serializeLocationSelection(selectedLocation) : ""}
          />
          <p className="text-sm text-muted-foreground">
            Search for your city so the journal can keep local time right and prepare for local
            weather later.
          </p>
          <p className="text-sm text-muted-foreground">
            Timezone:{" "}
            <span className="font-medium text-foreground">
              {selectedLocation?.timezone ?? timezone}
            </span>
          </p>

          {isLocationListVisible &&
          (isSearchingLocations || locationResults.length > 0 || locationSearchError) ? (
            <div className="rounded-[24px] border border-border/70 bg-background/95 p-2 shadow-sm">
              {isSearchingLocations ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching places...</p>
              ) : null}

              {!isSearchingLocations && locationSearchError ? (
                <p className="px-3 py-2 text-sm text-red-700 dark:text-red-200">
                  {locationSearchError}
                </p>
              ) : null}

              {!isSearchingLocations && !locationSearchError && locationResults.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No matching places found.</p>
              ) : null}

              {!isSearchingLocations && !locationSearchError ? (
                <div className="space-y-1">
                  {locationResults.map((location) => (
                    <button
                      className="flex w-full flex-col items-start rounded-[18px] px-3 py-2 text-left transition hover:bg-accent/40"
                      data-testid={`location-option-${location.label}`}
                      key={`${location.label}-${location.latitude}-${location.longitude}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setLocationQuery(location.label);
                        setSelectedLocation(location);
                        setLocationResults([]);
                        setLocationSearchError(null);
                        setIsLocationListVisible(false);
                      }}
                      type="button"
                    >
                      <span className="text-sm font-medium text-foreground">{location.label}</span>
                      <span className="text-xs text-muted-foreground">{location.timezone}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-[28px] border border-border/70 bg-background/60 p-5">
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
