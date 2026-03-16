import { describe, expect, it } from "vitest";

import {
  formatLocationLabel,
  mapOpenMeteoLocationResults,
  parseLocationSelection,
  serializeLocationSelection,
} from "@/lib/location-search";

describe("location search helpers", () => {
  it("formats city, region, and country into a readable label", () => {
    expect(
      formatLocationLabel({
        city: "Austin",
        country: "United States",
        region: "Texas",
      }),
    ).toBe("Austin, Texas, United States");
  });

  it("maps open-meteo geocoding results into saved location options", () => {
    expect(
      mapOpenMeteoLocationResults({
        results: [
          {
            admin1: "Illinois",
            country: "United States",
            latitude: 41.85,
            longitude: -87.65,
            name: "Chicago",
            timezone: "America/Chicago",
          },
        ],
      }),
    ).toEqual([
      {
        city: "Chicago",
        country: "United States",
        label: "Chicago, Illinois, United States",
        latitude: 41.85,
        longitude: -87.65,
        region: "Illinois",
        timezone: "America/Chicago",
      },
    ]);
  });

  it("round-trips a serialized location selection", () => {
    const selection = {
      city: "Chicago",
      country: "United States",
      label: "Chicago, Illinois, United States",
      latitude: 41.85,
      longitude: -87.65,
      region: "Illinois",
      timezone: "America/Chicago",
    };

    expect(parseLocationSelection(serializeLocationSelection(selection))).toEqual(selection);
  });
});
