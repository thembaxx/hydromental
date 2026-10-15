import { expect, test, type Page } from "./fixtures";

async function openExplorer(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#in")).toContainText("Oxygen");
  await expect(page.locator("#gl")).toBeVisible();
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

test("swipe navigates and a hold peeks without opening details", async ({ page }) => {
  const errors = await openExplorer(page);
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
  await page.mouse.down();
  await expect(page.locator("#pk")).toHaveClass(/on/);
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.42, { steps: 3 });
  await expect(page.locator("#pk")).not.toHaveClass(/on/);
  await page.mouse.up();
  await expect(page.locator("#in")).toContainText("Neon");
  expect(errors).toEqual([]);
});

test("the chemical family opens a filterable list of its elements", async ({ page }) => {
  const errors = await openExplorer(page);
  await page.getByRole("button", { name: "Show Nonmetal elements", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Element library" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Search elements", { exact: true }).fill("oxy");
  await dialog.getByRole("button", { name: "Show Oxygen on the stage", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#in")).toContainText("Oxygen");
  await page.getByRole("button", { name: "Show Nonmetal elements", exact: true }).click();
  await dialog.getByRole("button", { name: "Halogen", exact: true }).click();
  const halogens = dialog;
  await expect(halogens).toBeVisible();
  await halogens.getByRole("button", { name: "Show Fluorine on the stage", exact: true }).click();
  await expect(page.locator("#in")).toContainText("Fluorine");
  expect(errors).toEqual([]);
});

test("the stage keeps essential controls and reduced motion still swipes", async ({ page }) => {
  const errors = await openExplorer(page);
  for (const name of [
    "Zoom in",
    "Zoom out",
    "Reset camera",
    "Pause atom animation",
    "Explore",
    "Previous element",
    "Up the group",
    "Down the group",
    "Rotate",
  ]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "Next element", exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Period" })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Group" })).toHaveCount(0);
  await expect(page.getByText("Meet this element")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await dragAtom(page);
  await expect(page.locator("#in")).toContainText("Fluorine");
  expect(errors).toEqual([]);
});

test("pinch changes zoom and a cancelled gesture leaves swipe navigation usable", async ({
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
  await expect
    .poll(async () => Number(await page.locator("#app").getAttribute("data-zoom")))
    .toBeGreaterThan(1);
  await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await session.detach();
  await dragAtom(page);
  await expect(page.locator("#in")).toContainText("Fluorine");
  await expect(page.locator("#pk")).not.toHaveClass(/on/);
  expect(errors).toEqual([]);
});
