import { expect, test, type Page } from "./fixtures";

type ShaderReadings = { touch: [number, number]; strength: number; maxStrength: number };
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const view = window as unknown as { shaderReadings: ShaderReadings };
    view.shaderReadings = { touch: [0.5, 0.5], strength: 0, maxStrength: 0 };
    const names = new WeakMap<WebGLUniformLocation, string>();
    const proto = WebGL2RenderingContext.prototype;
    const get = proto.getUniformLocation;
    proto.getUniformLocation = function (program, name) {
      const location = get.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    const scalar = proto.uniform1f;
    proto.uniform1f = function (location, value) {
      if (location && names.get(location) === "uTouchStrength") {
        view.shaderReadings.strength = value;
        view.shaderReadings.maxStrength = Math.max(view.shaderReadings.maxStrength, value);
      }
      return scalar.call(this, location, value);
    };
    const vector = proto.uniform2f;
    proto.uniform2f = function (location, x, y) {
      if (location && names.get(location) === "uTouch") view.shaderReadings.touch = [x, y];
      return vector.call(this, location, x, y);
    };
  });
}
async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#gl")).toBeVisible();
  await page.locator("#gl").scrollIntoViewIfNeeded();
}

test("mouse coordinates reach GPU ripple uniforms and strength decays after interaction", async ({
  page,
}) => {
  await instrument(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const box = (await page.locator("#gl").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.25);
  const readings = () =>
    page.evaluate(() => (window as unknown as { shaderReadings: ShaderReadings }).shaderReadings);
  await expect.poll(async () => (await readings()).maxStrength).toBeGreaterThan(0.05);
  await expect.poll(async () => Math.abs((await readings()).touch[0] - 0.75)).toBeLessThan(0.03);
  await expect.poll(async () => Math.abs((await readings()).touch[1] - 0.75)).toBeLessThan(0.03);
  await page.mouse.move(1, 1);
  await expect.poll(async () => (await readings()).strength, { timeout: 10000 }).toBeLessThan(0.01);
});

test("real touchscreen taps trigger ripple uniforms and reduced motion suppresses them", async ({
  page,
  context,
}) => {
  await instrument(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const box = (await page.locator("#gl").boundingBox())!;
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.8, y: box.y + box.height * 0.25 }],
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { shaderReadings: ShaderReadings }).shaderReadings.maxStrength,
      ),
    )
    .toBeGreaterThan(0.05);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { shaderReadings: ShaderReadings }).shaderReadings.strength,
      ),
    )
    .toBe(0);
});

test("all auras select by keyboard without changing element data or discovery progress", async ({
  page,
}) => {
  await ready(page);
  const before = await page.locator("#pr").textContent();
  for (const name of ["Ember", "Solar", "Breeze", "Hydro"]) {
    const button = page.getByRole("button", { name: `${name} aura`, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".elemental-canvas")).toHaveAttribute(
      "data-aura",
      name.toLowerCase(),
    );
    await expect(page.locator("#in h1")).toHaveText("Oxygen");
    await expect(page.locator("#pr")).toHaveText(before!);
  }
});

test("missing Blender models use the procedural fallback and details remain usable", async ({
  page,
}) => {
  await page.route("**/models/hydro.glb", (route) => route.abort());
  await ready(page);
  await page.getByRole("button", { name: "Element details", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Element details", exact: true })).toBeVisible();
});

test("unavailable WebGL leaves a readable fallback and every element reachable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByRole("status").filter({ hasText: "3D is temporarily unavailable" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Search elements", exact: true }).click();
  await page.getByRole("combobox", { name: "Search elements" }).fill("Gold");
  await page.keyboard.press("Enter");
  await expect(page.locator("#in h1")).toHaveText("Gold");
});

test("dragging the aura cards snaps to a new atmosphere without navigating elements", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const viewport = page.locator(".aura-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.55, { steps: 14 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Hydro aura", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
    { timeout: 10000 },
  );
  await expect(page.locator('.aura-card[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator("#in h1")).toHaveText("Oxygen");
});
