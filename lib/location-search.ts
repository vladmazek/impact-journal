import { z } from "zod";

const openMeteoLocationResultSchema = z.object({
  admin1: z.string().optional(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
  timezone: z.string(),
});

const openMeteoLocationResponseSchema = z.object({
  results: z.array(openMeteoLocationResultSchema).optional(),
});

export const locationOptionSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  label: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  region: z.string().nullable(),
  timezone: z.string().min(1),
});

export type LocationOption = z.infer<typeof locationOptionSchema>;

export function formatLocationLabel(location: {
  city: string;
  country: string;
  region: string | null;
}) {
  return [location.city, location.region, location.country].filter(Boolean).join(", ");
}

export function mapOpenMeteoLocationResults(payload: unknown): LocationOption[] {
  const parsedPayload = openMeteoLocationResponseSchema.parse(payload);
  const uniqueOptions = new Map<string, LocationOption>();

  for (const result of parsedPayload.results ?? []) {
    const option = {
      city: result.name,
      country: result.country,
      label: formatLocationLabel({
        city: result.name,
        country: result.country,
        region: result.admin1 ?? null,
      }),
      latitude: result.latitude,
      longitude: result.longitude,
      region: result.admin1 ?? null,
      timezone: result.timezone,
    };

    if (!uniqueOptions.has(option.label)) {
      uniqueOptions.set(option.label, option);
    }
  }

  return Array.from(uniqueOptions.values());
}

export function parseLocationSelection(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return locationOptionSchema.parse(JSON.parse(value));
}

export function serializeLocationSelection(location: LocationOption) {
  return JSON.stringify(location);
}
