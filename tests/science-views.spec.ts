import { expect, test } from "./fixtures";
test("cards, detail sheets and public reference pages show the same attributed lithium interval", async ({
  page,
}) => {
  await page.goto("/?element=Li");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".element-number")).toContainText("[6.938, 6.997]");
  await expect(page.locator(".element-number")).not.toContainText(" u");
  await page.getByRole("button", { name: "Element details", exact: true }).click();
  await expect(page.locator(".property-list")).toContainText("CIAAW standard atomic weights");
  await expect(page.locator(".property-list")).toContainText("[6.938, 6.997]");
  await page.getByText(/Explore \d+ isotopes of Li/).click();
  await expect(page.getByRole("cell", { name: "0.0759(4)", exact: true })).toBeVisible();
  await page.goto("/elements/lithium");
  await expect(page.locator(".reference-facts")).toContainText("[6.938, 6.997]");
  await expect(
    page.getByRole("link", { name: "CIAAW standard atomic weights ↗", exact: true }),
  ).toBeVisible();
});
test("superheavy bulk phases are explicitly predictions on every reference surface", async ({
  page,
}) => {
  await page.goto("/elements/rutherfordium");
  await expect(page.locator(".reference-facts")).toContainText("Predicted solid");
  await expect(page.locator(".reference-properties")).toContainText("Prediction");
});
