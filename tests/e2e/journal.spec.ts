import { access } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { dateSlugToUtcDate } from "@/lib/date";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { expectedTodayForTimezone, loginAsSeededOwner } from "@/tests/helpers/e2e";
import { imageFixturePath } from "@/tests/helpers/media-fixtures";
import {
  countDailyEntries,
  countImageAttachments,
  findDailyEntryByDate,
  findUserById,
  findWeeklyReflectionByWeek,
  resetTestState,
} from "@/tests/helpers/test-db";

test.beforeEach(async () => {
  await resetTestState();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("autosave persists journal changes and never creates duplicate rows", async ({ page }) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-14");
  await page.getByRole("button", { name: /Great/i }).click();
  await page.getByLabel("Gratitude one").fill("Coffee on the porch");

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-14"));
      return entry?.gratitude1 ?? null;
    })
    .toBe("Coffee on the porch");

  await expect.poll(countDailyEntries).toBe(1);

  await page.reload();
  await expect(page.getByLabel("Gratitude one")).toHaveValue("Coffee on the porch");
  await expect.poll(countDailyEntries).toBe(1);
});

test("switching dates flushes pending changes and resets modal state on the destination page", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-14");
  await page.getByTestId("open-writing-modal").click();
  await expect(page.getByTestId("writing-modal")).toBeVisible();

  await page.getByTestId("writing-textarea").fill("A note that should save before navigation.");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("writing-modal")).toHaveCount(0);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page).toHaveURL(/\/entry\/2026-03-15$/);
  await expect(page.getByTestId("writing-modal")).toHaveCount(0);

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-14"));
      return entry?.dailyCapture ?? null;
    })
    .toBe("A note that should save before navigation.");

  await expect(page.getByTestId("daily-capture-preview")).toContainText(
    "Open the larger writing space",
  );

  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page).toHaveURL(/\/entry\/2026-03-14$/);
  await expect(page.getByTestId("daily-capture-preview")).toContainText(
    "A note that should save before navigation.",
  );
});

test("visiting a blank day does not create a daily entry row", async ({ page }) => {
  await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-18");
  await page.waitForTimeout(1200);

  await expect.poll(countDailyEntries).toBe(0);
});

test("the writing modal locks scroll on open and preserves text across close and reopen", async ({
  page,
}) => {
  await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-16");
  await page.getByTestId("open-writing-modal").click();
  await expect(page.getByTestId("writing-modal")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.getByTestId("writing-textarea").fill("This should still be here after reopening.");
  await page.keyboard.press("Escape");

  await expect(page.getByTestId("writing-modal")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");

  await page.getByTestId("open-writing-modal").click();
  await expect(page.getByTestId("writing-textarea")).toHaveValue(
    "This should still be here after reopening.",
  );
});

test("today resolves using the stored user timezone", async ({ page }) => {
  const timezone = "Pacific/Auckland";
  await loginAsSeededOwner(page, { timezone });

  await page.goto("/today");
  await expect(page).toHaveURL(new RegExp(`/entry/${expectedTodayForTimezone(timezone)}$`));
});

test("image uploads render previews, persist metadata, and deleting the last image prunes an otherwise blank entry", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-20");
  await page
    .getByTestId("image-upload-input")
    .setInputFiles([imageFixturePath("tiny.png")]);

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-20"));
      return entry?.imageAttachments.length ?? 0;
    })
    .toBe(1);

  const storedEntry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-20"));

  if (!storedEntry) {
    throw new Error("Expected the uploaded image entry to exist.");
  }

  const attachment = storedEntry.imageAttachments[0];
  const absoluteMediaPath = path.join(env.MEDIA_ROOT, attachment.relativePath);

  await expect(page.getByTestId("image-gallery")).toBeVisible();
  await expect(page.getByAltText("tiny.png")).toBeVisible();
  await expect.poll(countImageAttachments).toBe(1);
  await access(absoluteMediaPath);

  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("dialog", { name: "tiny.png" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByTestId(`delete-image-${attachment.id}`).click();

  await expect.poll(countImageAttachments).toBe(0);
  await expect.poll(countDailyEntries).toBe(0);
  await expect(access(absoluteMediaPath)).rejects.toThrow();
});

test("tags can be added from the picker and hashtags without creating duplicate tag records", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-21");
  await page.getByTestId("tag-input").fill("Deep Work");
  await page.getByRole("button", { name: "Add tag" }).click();
  await page.getByTestId("open-writing-modal").click();
  await page
    .getByTestId("writing-textarea")
    .fill("A slower morning with #deep_work and a good reset.");
  await page.keyboard.press("Escape");

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-21"));
      return entry?.tags.map((tag) => `${tag.tag.slug}:${tag.isManual}`).join("|") ?? "";
    })
    .toBe("deep-work:true");

  await expect(page.getByTestId("selected-tag-deep-work")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("selected-tag-deep-work")).toBeVisible();
});

test("weekly reflections save and link back to the days in that week", async ({ page }) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/week/2026/11");
  await page.getByRole("button", { name: /Good/i }).click();
  await page.getByTestId("open-weekly-summary").click();
  await page
    .getByTestId("weekly-summaryContext-textarea")
    .fill("A steadier week than it first felt like.");
  await page.keyboard.press("Escape");
  await page.getByTestId("life-area-work-rating-4").click();
  await page.getByTestId("life-area-work-note").fill("Strong focus windows.");
  await page.getByTestId("open-nextWeekIntention").click();
  await page
    .getByTestId("weekly-nextWeekIntention-textarea")
    .fill("Protect mornings for the most important work.");
  await page.keyboard.press("Escape");

  await expect
    .poll(async () => {
      const reflection = await findWeeklyReflectionByWeek(user.id, 2026, 11);
      return reflection?.nextWeekIntention ?? null;
    })
    .toBe("Protect mornings for the most important work.");

  await page.getByRole("link", { name: /Sat/i }).click();
  await expect(page).toHaveURL(/\/entry\/2026-03-14$/);
});

test("settings updates the owner profile and password for the next login", async ({ page }) => {
  const seededOwner = await loginAsSeededOwner(page);
  const nextEmail = "owner+updated@example.com";
  const nextPassword = "even-more-secret-password";

  await page.goto("/settings");
  await page.getByLabel("Name").fill("Updated Owner");
  await page.getByLabel("Email").fill(nextEmail);
  await page.getByLabel("Timezone").fill("America/Chicago");
  await page.getByRole("button", { name: "Save account settings" }).click();

  await expect
    .poll(async () => {
      const user = await findUserById(seededOwner.user.id);
      return `${user?.displayName}:${user?.email}:${user?.timezone}`;
    })
    .toBe(`Updated Owner:${nextEmail}:America/Chicago`);

  await page.getByLabel("Current password").fill(seededOwner.password);
  await page.getByLabel("New password").fill(nextPassword);
  await page.getByLabel("Confirm password").fill(nextPassword);
  await page.getByRole("button", { name: "Update password" }).click();

  await page.getByRole("button", { name: /Updated Owner/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(nextEmail);
  await page.getByLabel("Password").fill(nextPassword);
  await page.getByRole("button", { name: "Open journal" }).click();
  await expect(page).toHaveURL(/\/entry\/\d{4}-\d{2}-\d{2}$/);
});
