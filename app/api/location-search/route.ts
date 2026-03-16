import { type NextRequest } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { mapOpenMeteoLocationResults } from "@/lib/location-search";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return Response.json({ results: [] });
  }

  const searchUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  searchUrl.searchParams.set("count", "6");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("language", "en");
  searchUrl.searchParams.set("name", query);

  try {
    const response = await fetch(searchUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Impact Journal",
      },
    });

    if (!response.ok) {
      return new Response("Unable to load locations", { status: 502 });
    }

    const payload = await response.json();

    return Response.json({
      results: mapOpenMeteoLocationResults(payload),
    });
  } catch {
    return new Response("Unable to load locations", { status: 502 });
  }
}
