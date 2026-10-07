import { test as base } from "@playwright/test";
import { ONBOARDING_STORAGE_KEY } from "../lib/onboarding";

export { expect, type Page } from "@playwright/test";

/** Regression workflows represent returning visitors; onboarding tests opt into a fresh visit. */
export const test = base.extend<{ introduction: "completed" | "new" }>({
  introduction: ["completed", { option: true }],
  page: async ({ page, introduction }, use) => {
    if (introduction === "completed") {
      await page.addInitScript((key) => localStorage.setItem(key, "done"), ONBOARDING_STORAGE_KEY);
    }
    await use(page);
  },
});
