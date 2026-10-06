import { expect, test, type Page } from "@playwright/test";

async function openExplorer(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#in")).toContainText("Oxygen");
  await page.waitForFunction(
    () => !!(document.querySelector("#gl") as HTMLCanvasElement).getContext("webgl2"),
  );
  const hint = page.getByRole("button", { name: "Got it", exact: true });
  if (await hint.isVisible()) await hint.click();
  await page.locator("#app").scrollIntoViewIfNeeded();
  return errors;
}

async function dragAtom(page: Page) {
  const box = (await page.locator("#app").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.43);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.29, box.y + box.height * 0.43, { steps: 3 });
  await page.mouse.up();
}

test("rotation drag keeps the element; Explore swipe navigates and hold is not a tap", async ({
  page,
}) => {
  const errors = await openExplorer(page);
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rotate", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dragAtom(page);
  await expect(page.locator("#in")).toContainText("Oxygen");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await dragAtom(page);
  await expect(page.locator("#in")).toContainText("Fluorine");
  const box = (await page.locator("#app").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.42);
  await page.mouse.down();
  await expect(page.locator("#pk")).toHaveClass(/on/);
  await expect(page.locator("#pk")).toContainText("9 protons");
  await page.mouse.up();
  await expect(page.locator("#pk")).not.toHaveClass(/on/);
  await expect(page.locator(".inspection-card")).toHaveCount(0);
  // Once movement begins, a long press becomes a drag rather than swallowing it.
  await page.mouse.down();
  await expect(page.locator("#pk")).toHaveClass(/on/);
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.42, { steps: 3 });
  await expect(page.locator("#pk")).not.toHaveClass(/on/);
  await page.mouse.up();
  await expect(page.locator("#in")).toContainText("Neon");
  expect(errors).toEqual([]);
});

test("scientific shell selection matches real populations and camera reset clears inspection", async ({
  page,
}) => {
  const errors = await openExplorer(page);
  await page.getByRole("button", { name: "Switch to scientific model" }).click();
  await expect(page.locator("#shell-select option")).toHaveText([
    "Nucleus · 8 protons",
    "Shell 1 · 2 electrons",
    "Shell 2 · 6 electrons",
  ]);
  await page.locator("#shell-select").selectOption("2");
  await expect(page.locator(".inspection-card")).toContainText("Shell 2 · 6 electrons");
  await expect(page.locator(".inspection-card")).toContainText("not a literal path");
  await page.locator("#shell-select").selectOption("0");
  await expect(page.locator(".inspection-card")).toContainText("8 protons in the nucleus");
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await expect(page.locator(".inspection-card")).toHaveCount(0);
  await page.locator("#shell-select").selectOption("1");
  await page.getByRole("button", { name: "Switch to playful model" }).click();
  await expect(page.locator("#shell-select")).toHaveCount(0);
  await expect(page.locator(".inspection-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Switch to scientific model" }).click();
  await expect(page.locator("#shell-select")).toHaveValue("0");
  expect(errors).toEqual([]);
});

test("camera zoom bounds, pause and live reduced motion keep controls usable", async ({ page }) => {
  const errors = await openExplorer(page);
  const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
  const zoomOut = page.getByRole("button", { name: "Zoom out", exact: true });
  for (let step = 0; step < 8 && (await zoomIn.isEnabled()); step++) await zoomIn.click();
  await expect(zoomIn).toBeDisabled();
  await expect(zoomOut).toBeEnabled();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await expect(zoomIn).toBeEnabled();
  await expect(zoomOut).toBeEnabled();
  for (let step = 0; step < 5 && (await zoomOut.isEnabled()); step++) await zoomOut.click();
  await expect(zoomOut).toBeDisabled();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await page.getByRole("button", { name: "Pause atom animation", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume atom animation", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Switch to scientific model" }).click();
  await page.locator("#shell-select").selectOption("2");
  await expect(page.locator(".inspection-card")).toContainText("6 electrons");
  await page.getByRole("button", { name: "Resume atom animation", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause atom animation", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await dragAtom(page);
  await expect(page.locator("#in")).toContainText("Fluorine");
  expect(errors).toEqual([]);
});

test("pinch changes zoom and a cancelled gesture leaves Explore navigation usable", async ({
  page,
}) => {
  const errors = await openExplorer(page);
  const box = (await page.locator("#app").boundingBox())!;
  const centerX = box.x + box.width * 0.5;
  const centerY = box.y + box.height * 0.43;
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: centerX - 20, y: centerY, id: 1 },
      { x: centerX + 20, y: centerY, id: 2 },
    ],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: centerX - 65, y: centerY, id: 1 },
      { x: centerX + 65, y: centerY, id: 2 },
    ],
  });
  await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeDisabled();
  await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await session.detach();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await dragAtom(page);
  await expect(page.locator("#in")).toContainText("Fluorine");
  await expect(page.locator("#pk")).not.toHaveClass(/on/);
  expect(errors).toEqual([]);
});
