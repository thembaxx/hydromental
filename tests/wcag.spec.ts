import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function audit(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.map((violation) => ({
      rule: violation.id,
      nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  ).toEqual([]);
}

test("explorer themes and search satisfy automated WCAG checks", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await audit(page);
  for (const theme of ["dusk", "midnight"]) {
    await page.locator("#mb").click();
    await page.locator(`[data-t="${theme}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("#pl")).toHaveCSS(
      "color",
      theme === "dusk" ? "rgb(255, 255, 255)" : "rgb(245, 247, 255)",
    );
    await audit(page);
  }
  await page.locator("#sb").click();
  await page.locator("#si").fill("Aluminium");
  await audit(page);
});

test("learning, comparison, playground and table dialogs satisfy automated WCAG checks", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  for (const name of [
    "Open discovery journal",
    "Compare elements",
    "Open bonding playground",
    "Share element",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await audit(page);
    await page.keyboard.press("Escape");
  }
  await page.locator("#gb").click();
  await audit(page);
  await page.locator("#qb").click();
  await audit(page);
});

test("element details and readable reference pages satisfy automated WCAG checks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#in").click();
  await audit(page);
  await page.goto("/elements");
  await audit(page);
  await page.goto("/elements/lawrencium");
  await audit(page);
});
