import { File } from "node:buffer";
import { readFile } from "node:fs/promises";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { saveUploadedImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { imageFixturePath } from "@/tests/helpers/media-fixtures";
import { resetTestState } from "@/tests/helpers/test-db";

describe("mounted media storage", () => {
  beforeEach(async () => {
    await resetTestState();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("extracts metadata and stores JPEG, PNG, and WEBP uploads under the date-based originals path", async () => {
    const [jpegBuffer, pngBuffer, webpBuffer] = await Promise.all([
      readFile(imageFixturePath("tiny.jpg")),
      readFile(imageFixturePath("tiny.png")),
      readFile(imageFixturePath("tiny.webp")),
    ]);

    const [jpegImage, pngImage, webpImage] = await Promise.all([
      saveUploadedImage(new File([jpegBuffer], "tiny.jpg", { type: "image/jpeg" }), {
        baseName: "tiny-jpeg",
        bucket: "originals",
        dateSlug: "2026-03-14",
      }),
      saveUploadedImage(new File([pngBuffer], "tiny.png", { type: "image/png" }), {
        baseName: "tiny-png",
        bucket: "originals",
        dateSlug: "2026-03-14",
      }),
      saveUploadedImage(new File([webpBuffer], "tiny.webp", { type: "image/webp" }), {
        baseName: "tiny-webp",
        bucket: "originals",
        dateSlug: "2026-03-14",
      }),
    ]);

    expect(jpegImage.relativePath).toMatch(/^originals\/2026\/03\/2026-03-14-/);
    expect(pngImage.relativePath).toMatch(/^originals\/2026\/03\/2026-03-14-/);
    expect(webpImage.relativePath).toMatch(/^originals\/2026\/03\/2026-03-14-/);

    expect(jpegImage.width).toBeGreaterThan(0);
    expect(jpegImage.height).toBeGreaterThan(0);
    expect(pngImage.width).toBeGreaterThan(0);
    expect(pngImage.height).toBeGreaterThan(0);
    expect(webpImage.width).toBeGreaterThan(0);
    expect(webpImage.height).toBeGreaterThan(0);
  });

  it("fails HEIC uploads gracefully when the Docker image cannot process that file reliably", async () => {
    const heicBuffer = await readFile(imageFixturePath("unsupported.heic"));

    await expect(
      saveUploadedImage(new File([heicBuffer], "unsupported.heic", { type: "image/heic" }), {
        baseName: "unsupported-heic",
        bucket: "originals",
        dateSlug: "2026-03-14",
      }),
    ).rejects.toThrow(
      "This Docker environment could not process that HEIC image reliably. Please try JPEG, PNG, or WEBP.",
    );
  });
});
