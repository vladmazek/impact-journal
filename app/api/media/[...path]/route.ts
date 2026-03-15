import { type NextRequest } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { loadMediaFile } from "@/lib/media";

type RouteContext = {
  params: {
    path: string[];
  };
};

function contentTypeFromExtension(extension: string) {
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "application/octet-stream";
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const relativePath = params.path.join("/");
    const file = await loadMediaFile(relativePath);

    return new Response(file.buffer, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Length": file.byteSize.toString(),
        "Content-Type": contentTypeFromExtension(file.extension),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
