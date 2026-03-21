import { access } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { dateSlugToUtcDate, resolveDailyPromptSection } from "@/lib/date";
import { env } from "@/lib/env";
import { getMotivationalQuotes } from "@/lib/motivational-quotes";
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

test("relax list keeps focus while typing and saves only after blur", async ({ page }) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-14");
  const relaxInput = page.getByPlaceholder("A small reset for later #1");

  await relaxInput.click();
  await relaxInput.pressSequentially("Get ettt");
  await expect(relaxInput).toHaveValue("Get ettt");
  await expect(relaxInput).toBeFocused();
  await page.waitForTimeout(1500);
  await expect(relaxInput).toBeFocused();

  await expect.poll(countDailyEntries).toBe(0);

  await page.getByText("To relax").click();

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-14"));
      return entry?.relaxItems.map((item) => item.text).join("|") ?? null;
    })
    .toBe("Get ettt");

  await page.reload();
  await expect(relaxInput).toHaveValue("Get ettt");
  await expect.poll(countDailyEntries).toBe(1);
});

test("pressing Enter in the relax list adds the next field and moves focus", async ({
  page,
}) => {
  await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-14");
  const firstRelaxInput = page.getByPlaceholder("A small reset for later #1");

  await firstRelaxInput.click();
  await firstRelaxInput.pressSequentially("Make tea");
  await firstRelaxInput.press("Enter");

  const secondRelaxInput = page.getByPlaceholder("A small reset for later #2");
  await expect(secondRelaxInput).toBeVisible();
  await expect(secondRelaxInput).toBeFocused();
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
  await page.getByRole("button", { name: "Open 2026-03-15" }).click();

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

  await page.getByRole("button", { name: "Open 2026-03-14" }).click();
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

test("selecting a mood collapses the picker and the sidebar summary reopens it", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-17");
  await expect(page.getByTestId("entry-mood-picker-section")).toBeVisible();
  await expect(page.getByTestId("mood-anchor-button")).toHaveCount(0);
  await expect(page.getByText("No mood chosen yet")).toHaveCount(0);

  await page
    .getByTestId("entry-mood-picker-section")
    .getByRole("button", { name: /Great/ })
    .click();

  await expect(page.getByTestId("entry-mood-picker-section")).toHaveCount(0);
  await expect(page.getByText("Mood anchor")).toHaveCount(0);
  await expect(page.getByTestId("mood-anchor-button")).toContainText("Great");

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-17"));
      return entry ? `${entry.moodValue}|${entry.moodLabel}|${entry.moodEmoji}` : null;
    })
    .toBe("great|Great|😄");

  await page.reload();
  await expect(page.getByTestId("entry-mood-picker-section")).toHaveCount(0);
  await expect(page.getByText("Mood anchor")).toHaveCount(0);
  await expect(page.getByTestId("mood-anchor-button")).toContainText("Great");

  await page.getByTestId("mood-anchor-button").click();
  await expect(page.getByTestId("entry-mood-picker-section")).toBeVisible();
});

test("daily entry header shows only a motivational quote", async ({ page }) => {
  await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-18");

  await expect(page.getByText("Today's page")).toHaveCount(0);
  await expect(page.getByText("Daily page")).toHaveCount(0);
  await expect(page.getByText("Saved journal entry")).toHaveCount(0);
  await expect(page.getByText("Draft not created until first save")).toHaveCount(0);
  await expect(page.getByText("Motivational quote")).toHaveCount(0);

  const authorText = (await page.getByTestId("entry-hero-author").textContent())?.trim() ?? "";
  const quoteText = (await page.getByTestId("entry-hero-quote").textContent())?.trim() ?? "";

  expect(authorText.length).toBeGreaterThan(0);
  expect(quoteText.length).toBeGreaterThan(0);
  expect(
    getMotivationalQuotes().some(
      (quote) => quote.author === authorText && `“${quote.quote}”` === quoteText,
    ),
  ).toBe(true);
});

test("past entries show both prompt sections expanded by default", async ({ page }) => {
  await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-14");

  const morningAccordionContent = page.getByTestId("morning-accordion-content");
  const eveningAccordionContent = page.getByTestId("evening-accordion-content");

  await expect(page.getByTestId("morning-accordion-trigger")).toBeVisible();
  await expect(page.getByTestId("evening-accordion-trigger")).toBeVisible();
  await expect(morningAccordionContent).toBeVisible();
  await expect(eveningAccordionContent).toBeVisible();

  await page.getByTestId("evening-accordion-trigger").click();
  await expect(morningAccordionContent).toBeVisible();
  await expect(eveningAccordionContent).toBeHidden();

  await page.getByTestId("evening-accordion-trigger").click();
  await expect(eveningAccordionContent).toBeVisible();
  await expect(morningAccordionContent).toBeVisible();
});

test("today's entry opens the time-appropriate prompt section and still supports toggling", async ({
  page,
}) => {
  await loginAsSeededOwner(page);

  const timezone = "America/New_York";
  const todaySlug = expectedTodayForTimezone(timezone);
  const expectedOpenSection = resolveDailyPromptSection(new Date(), timezone);
  const expectedClosedSection = expectedOpenSection === "morning" ? "evening" : "morning";

  await page.goto(`/entry/${todaySlug}`);

  const morningAccordionContent = page.getByTestId("morning-accordion-content");
  const eveningAccordionContent = page.getByTestId("evening-accordion-content");

  if (expectedOpenSection === "morning") {
    await expect(morningAccordionContent).toBeVisible();
    await expect(eveningAccordionContent).toBeHidden();
  } else {
    await expect(eveningAccordionContent).toBeVisible();
    await expect(morningAccordionContent).toBeHidden();
  }

  await page.getByTestId(`${expectedOpenSection}-accordion-trigger`).click();
  await expect(morningAccordionContent).toBeHidden();
  await expect(eveningAccordionContent).toBeHidden();

  await page.getByTestId(`${expectedClosedSection}-accordion-trigger`).click();
  if (expectedClosedSection === "morning") {
    await expect(morningAccordionContent).toBeVisible();
    await expect(eveningAccordionContent).toBeHidden();
  } else {
    await expect(eveningAccordionContent).toBeVisible();
    await expect(morningAccordionContent).toBeHidden();
  }
});

test("prompt forms use the permanent cards layout and keep values after reload", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-14");

  await expect(page.getByTestId("morning-prompt-form")).toBeVisible();
  await expect(page.getByTestId("evening-prompt-form")).toBeVisible();
  await expect(
    page.locator('[data-testid="morning-accordion-trigger"] [data-testid="morning-scene-illustration"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="morning-accordion-trigger"] [data-testid="evening-scene-illustration"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid="evening-accordion-trigger"] [data-testid="evening-scene-illustration"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="evening-accordion-trigger"] [data-testid="morning-scene-illustration"]'),
  ).toHaveCount(0);
  await expect(page.getByTestId("morning-prompt-form-variant-toggle")).toHaveCount(0);
  await expect(page.getByTestId("evening-prompt-form-variant-toggle")).toHaveCount(0);
  await expect(page.getByText("Form look")).toHaveCount(0);
  await expect(page.getByText(/^Today$/)).toHaveCount(0);
  await expect(page.getByText(/^Keep close$/i)).toHaveCount(0);

  await page.getByLabel("Gratitude one").fill("Light through the window");
  await page.getByLabel("Good thing one").fill("Dinner together felt easy");
  await page.getByLabel("How could today have gone better?").click();

  await expect(page.getByLabel("Gratitude one")).toHaveValue("Light through the window");
  await expect(page.getByLabel("Good thing one")).toHaveValue("Dinner together felt easy");

  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-14"));
      return {
        eveningGood1: entry?.eveningGood1 ?? null,
        gratitude1: entry?.gratitude1 ?? null,
      };
    })
    .toEqual({
      eveningGood1: "Dinner together felt easy",
      gratitude1: "Light through the window",
    });

  await page.reload();

  await expect(page.getByTestId("morning-prompt-form")).toBeVisible();
  await expect(page.getByTestId("evening-prompt-form")).toBeVisible();
  await expect(page.getByLabel("Gratitude one")).toHaveValue("Light through the window");
  await expect(page.getByLabel("Good thing one")).toHaveValue("Dinner together felt easy");
});

test("the writing modal stays open while paused and preserves text across close and reopen", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-16");
  await page.getByTestId("open-writing-modal").click();
  await expect(page.getByTestId("writing-modal")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page
    .getByTestId("writing-textarea")
    .pressSequentially("This should still be here after reopening.");
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("writing-modal")).toBeVisible();
  await expect(page).toHaveURL(/\/entry\/2026-03-16$/);
  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-16"));
      return entry?.dailyCapture ?? null;
    })
    .toBeNull();

  await page.keyboard.press("Escape");

  await expect(page.getByTestId("writing-modal")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-16"));
      return entry?.dailyCapture ?? null;
    })
    .toBe("This should still be here after reopening.");

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
  await expect(page.getByText(/Photos live on mounted disk storage/)).toHaveCount(0);
  await expect(page.getByText(/Stored under mounted media at/)).toHaveCount(0);
  await expect(page.getByText(/Tap a remembered tag/)).toHaveCount(0);
  await expect(page.getByText("Keep recall light", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Filled tags stay pinned from the picker/)).toHaveCount(0);
  await expect(page.getByText("Recent tags", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Writing room", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Image cadence", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Tag memory", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Evening note", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Private by default\. One person, one journal/)).toHaveCount(0);
  await expect(page.getByText("Tags", { exact: true })).toBeVisible();
  await expect(page.getByTestId("tag-input")).toHaveCount(0);
  await expect(page.getByTestId("open-tag-input")).toBeVisible();

  if (!(await page.getByTestId("morning-accordion-content").isVisible())) {
    await page.getByTestId("morning-accordion-trigger").click();
  }

  await page.getByLabel("What would make today great?").fill("A slower #deep_work morning.");
  await expect(page.getByTestId("selected-tag-deep-work")).toHaveText("#deep-work");
  await page.getByTestId("open-tag-input").click();
  await page.getByTestId("tag-input").click();
  await page.getByTestId("tag-input").fill("Deep Work");
  await page.getByTestId("submit-tag-input").click();
  await expect(page.getByTestId("tag-input")).toHaveCount(0);

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

test("topbar navigation flushes pending text changes before leaving the day page", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/entry/2026-03-19");
  await page.getByLabel("Gratitude one").click();
  await page.getByLabel("Gratitude one").pressSequentially("Saved before settings navigation");
  await page.getByRole("link", { name: "Open journal settings" }).click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect
    .poll(async () => {
      const entry = await findDailyEntryByDate(user.id, dateSlugToUtcDate("2026-03-19"));
      return entry?.gratitude1 ?? null;
    })
    .toBe("Saved before settings navigation");
});

test("topbar brand returns to today's entry", async ({ page }) => {
  await loginAsSeededOwner(page);

  const todaySlug = expectedTodayForTimezone("America/New_York");

  await page.goto("/entry/2026-03-19");
  await page.getByTestId("journal-home-link").click();
  await expect(page).toHaveURL(new RegExp(`/entry/${todaySlug}$`));

  await page.goto("/settings");
  await page.getByTestId("journal-home-link").click();
  await expect(page).toHaveURL(new RegExp(`/entry/${todaySlug}$`));
});

test("weekly writing stays open while paused and day links flush pending changes", async ({
  page,
}) => {
  const { user } = await loginAsSeededOwner(page);

  await page.goto("/week/2026/11");
  await page.getByTestId("open-weekly-summary").click();
  await page
    .getByTestId("weekly-summaryContext-textarea")
    .pressSequentially("A steadier week than it first felt like.");
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("writing-modal")).toBeVisible();
  await expect
    .poll(async () => {
      const reflection = await findWeeklyReflectionByWeek(user.id, 2026, 11);
      return reflection?.energySummary ?? null;
    })
    .toBeNull();

  await page.keyboard.press("Escape");
  await expect
    .poll(async () => {
      const reflection = await findWeeklyReflectionByWeek(user.id, 2026, 11);
      return reflection?.energySummary ?? null;
    })
    .toBe("A steadier week than it first felt like.");

  await page.getByTestId("life-area-work-rating-4").click();
  await page.getByTestId("life-area-work-note").click();
  await page.getByTestId("life-area-work-note").pressSequentially("Strong focus windows.");
  await page.getByRole("link", { name: /Sat/i }).click();

  await expect(page).toHaveURL(/\/entry\/2026-03-14$/);
  await expect
    .poll(async () => {
      const reflection = await findWeeklyReflectionByWeek(user.id, 2026, 11);
      return (
        reflection?.lifeAreaRatings.find((rating) => rating.areaKey === "work")?.note ?? null
      );
    })
    .toBe("Strong focus windows.");
});

test("settings updates the owner profile and password for the next login", async ({ page }) => {
  const seededOwner = await loginAsSeededOwner(page);
  const nextEmail = "owner+updated@example.com";
  const nextPassword = "even-more-secret-password";
  const chicagoLocation = {
    city: "Chicago",
    country: "United States",
    label: "Chicago, Illinois, United States",
    latitude: 41.8781,
    longitude: -87.6298,
    region: "Illinois",
    timezone: "America/Chicago",
  };

  await page.route("**/api/location-search**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        results: [chicagoLocation],
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/settings");
  await page.getByLabel("Name").fill("Updated Owner");
  await page.getByLabel("Email").fill(nextEmail);
  await page.getByLabel("Home location").fill("Chicago");
  await page.getByRole("button", { name: /Chicago, Illinois, United States/ }).click();
  await page.getByRole("button", { name: "Save account settings" }).click();

  await expect
    .poll(async () => {
      const user = await findUserById(seededOwner.user.id);
      return `${user?.displayName}:${user?.email}:${user?.locationLabel}:${user?.timezone}`;
    })
    .toBe(`Updated Owner:${nextEmail}:${chicagoLocation.label}:America/Chicago`);

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
