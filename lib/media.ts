import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { env } from "@/lib/env";

const allowedMimeTypes = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
]);

const allowedExtensions = new Set<string>(["jpg", "jpeg", "png", "webp", "heic", "heif"]);

export type StoredImage = {
  byteSize: number;
  extension: string;
  height: number | null;
  mimeType: string;
  originalFilename: string;
  relativePath: string;
  storedFilename: string;
  width: number | null;
};

type ImageUploadSource = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
};

function getDateParts(date: Date) {
  const year = date.getFullYear().toString();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return { year, month, day };
}

function slugifySegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function detectExtension(file: ImageUploadSource) {
  const mimeExtension = allowedMimeTypes.get(file.type);

  if (mimeExtension) {
    return mimeExtension;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (allowedExtensions.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return null;
}

function mimeFromExtension(extension: string) {
  switch (extension) {
    case "jpg":
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

export function resolveMediaPath(relativePath: string) {
  const absolutePath = path.resolve(env.MEDIA_ROOT, relativePath);
  const mediaRoot = path.resolve(env.MEDIA_ROOT);

  if (absolutePath !== mediaRoot && !absolutePath.startsWith(`${mediaRoot}${path.sep}`)) {
    throw new Error("Invalid media path.");
  }

  return absolutePath;
}

export async function loadMediaFile(relativePath: string) {
  const absolutePath = resolveMediaPath(relativePath);
  const [buffer, fileStat] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);

  return {
    buffer,
    byteSize: fileStat.size,
    extension: path.extname(absolutePath).replace(".", "").toLowerCase(),
  };
}

export async function removeStoredFile(relativePath: string) {
  const absolutePath = resolveMediaPath(relativePath);

  await rm(absolutePath, { force: true });
}

export async function saveUploadedImage(
  file: ImageUploadSource,
  options: {
    baseName: string;
    bucket: "avatars" | "originals";
    dateSlug?: string;
  },
) {
  if (file.size === 0) {
    throw new Error("Please choose an image before continuing.");
  }

  const maxBytes = env.MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Images must be smaller than ${env.MAX_IMAGE_UPLOAD_MB}MB.`);
  }

  const extension = detectExtension(file);
  if (!extension) {
    throw new Error("Only JPEG, PNG, WEBP, and HEIC images are supported.");
  }

  const normalizedDate =
    options.dateSlug && /^\d{4}-\d{2}-\d{2}$/.test(options.dateSlug)
      ? options.dateSlug
      : null;
  const fallbackDateParts = getDateParts(new Date());
  const [year, month, day] = normalizedDate
    ? normalizedDate.split("-")
    : [fallbackDateParts.year, fallbackDateParts.month, fallbackDateParts.day];
  const prefix = `${year}-${month}-${day}`;
  const directory = path.join(options.bucket, year, month);
  const absoluteDirectory = resolveMediaPath(directory);
  const baseSlug = slugifySegment(options.baseName || file.name) || "image";
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  let outputBuffer = originalBuffer;
  let outputExtension = extension;
  let outputMimeType = file.type || mimeFromExtension(extension);
  let width: number | null = null;
  let height: number | null = null;

  try {
    if (extension === "heic" || extension === "heif") {
      const converted = await sharp(originalBuffer, { limitInputPixels: false })
        .rotate()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      outputBuffer = Buffer.from(converted.data);
      outputExtension = "jpg";
      outputMimeType = "image/jpeg";
      width = converted.info.width ?? null;
      height = converted.info.height ?? null;
    } else {
      const metadata = await sharp(originalBuffer, { limitInputPixels: false }).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    }
  } catch {
    if (extension === "heic" || extension === "heif") {
      throw new Error(
        "This Docker environment could not process that HEIC image reliably. Please try JPEG, PNG, or WEBP.",
      );
    }

    throw new Error("That image could not be read. Please try a different file.");
  }

  await mkdir(absoluteDirectory, { recursive: true });

  let storedFilename = `${prefix}-${baseSlug}.${outputExtension}`;
  let absolutePath = path.join(absoluteDirectory, storedFilename);

  try {
    await stat(absolutePath);
    storedFilename = `${prefix}-${baseSlug}-${randomBytes(3).toString("hex")}.${outputExtension}`;
    absolutePath = path.join(absoluteDirectory, storedFilename);
  } catch {
    // The first filename is available.
  }

  await writeFile(absolutePath, outputBuffer);

  return {
    byteSize: outputBuffer.length,
    extension: outputExtension,
    height,
    mimeType: outputMimeType,
    originalFilename: file.name,
    relativePath: path.join(directory, storedFilename),
    storedFilename,
    width,
  } satisfies StoredImage;
}
