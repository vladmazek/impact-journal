import { expect, type Page } from "@playwright/test";

import { resolveTodayDateSlug } from "@/lib/date";
import { TEST_OWNER, createOwnerUser } from "@/tests/helpers/test-db";

type SeedOwnerOptions = Parameters<typeof createOwnerUser>[0];

export async function loginAsSeededOwner(page: Page, options: SeedOwnerOptions = {}) {
  const seededOwner = await createOwnerUser(options);

  await page.goto("/login");
  await page.getByLabel("Email").fill(seededOwner.user.email);
  await page.getByLabel("Password").fill(seededOwner.password);
  await page.getByRole("button", { name: "Open journal" }).click();
  await expect(page).toHaveURL(/\/entry\/\d{4}-\d{2}-\d{2}$/);

  return seededOwner;
}

export async function createJournalThroughSetup(page: Page) {
  await page.goto("/setup");
  await page.getByLabel("Name").fill(TEST_OWNER.displayName);
  await page.getByLabel("Email").fill(TEST_OWNER.email);
  await page.getByLabel("Password").fill(TEST_OWNER.password);
  await page.getByRole("button", { name: "Create private journal" }).click();
  await expect(page).toHaveURL(/\/entry\/\d{4}-\d{2}-\d{2}$/);
}

export function expectedTodayForTimezone(timezone: string) {
  return resolveTodayDateSlug(new Date(), timezone);
}
