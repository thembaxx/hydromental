import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("initial server HTML contains element content and controls before JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.locator("#in h1")).toHaveText("Oxygen");
  await expect(page.getByRole("slider", { name: "Element atomic number scrubber" })).toBeVisible();
  await expect(page.locator('main[aria-busy="true"]')).toHaveCount(0);
  await context.close();
});

test("modes, scrubber boundaries, sound and keyboard shortcuts stay synchronized", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  const slider = page.getByRole("slider", { name: "Element atomic number scrubber" });
  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "118");
  await expect(page.getByRole("button", { name: "Next element", exact: true })).toBeDisabled();
  await slider.press("Home");
  await expect(page.locator("#in h1")).toHaveText("Hydrogen");
  await expect(page.getByRole("button", { name: "Previous element", exact: true })).toBeDisabled();
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "2");
  await expect(slider).toHaveAttribute("aria-valuetext", /Helium/);
  await page.getByRole("button", { name: "Quantum Cloud", exact: true }).click();
  await expect(page.locator(".elemental-canvas")).toHaveAttribute("data-mode", "cloud");
  await page.keyboard.press("3");
  await expect(page.getByRole("button", { name: "Crystal & Matter", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("m");
  await expect(page.getByRole("button", { name: "Mute sound effects", exact: true })).toBeVisible();
  await page.keyboard.press("m");
  await expect(
    page.getByRole("button", { name: "Unmute sound effects", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#in h1")).toHaveText("Lithium");
  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  await page.getByRole("combobox", { name: "Search elements" }).fill("123m");
  await expect(page.getByRole("combobox", { name: "Search elements" })).toHaveValue("123m");
  await page.keyboard.press("Escape");
  await expect(page.locator("#app")).toHaveAttribute("data-mode", "matter");
  await expect(slider).toHaveAttribute("aria-valuenow", "3");
});

test("the element library preview supports every mode and passes WCAG checks", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/elements");
  for (const mode of ["Quantum Cloud", "Crystal & Matter", "Bohr Orbitals"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await expect(page.getByRole("button", { name: mode, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  const slider = page.getByRole("slider", { name: "Element atomic number scrubber" });
  await slider.focus();
  await slider.press("End");
  await expect(page.locator(".reference-stage-copy h2")).toContainText("Oganesson");
  await expect(page.locator(".elemental-canvas")).toHaveAttribute("data-mode", "bohr");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("sound requires opt-in, mute stops new notes, and reduced motion suppresses haptics", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const readings = { notes: 0, vibrations: 0 };
    Object.defineProperty(window, "elementalAudioReadings", { value: readings });
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      readings.notes += 1;
      return create.call(this);
    };
    navigator.vibrate = () => {
      readings.vibrations += 1;
      return true;
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  const readings = () =>
    page.evaluate(
      () =>
        (window as unknown as { elementalAudioReadings: { notes: number; vibrations: number } })
          .elementalAudioReadings,
    );
  const slider = page.getByRole("slider", { name: "Element atomic number scrubber" });
  await slider.focus();
  await slider.press("ArrowRight");
  expect((await readings()).notes).toBe(0);
  await page.getByRole("button", { name: "Unmute sound effects", exact: true }).click();
  await page.getByRole("button", { name: "Quantum Cloud", exact: true }).click();
  await expect.poll(async () => (await readings()).notes).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Mute sound effects", exact: true }).click();
  const mutedNotes = (await readings()).notes;
  await slider.focus();
  await slider.press("ArrowRight");
  await page.getByRole("button", { name: "Crystal & Matter", exact: true }).click();
  expect((await readings()).notes).toBe(mutedNotes);
  expect((await readings()).vibrations).toBe(0);
});
