import { expect, test, type Page } from "@playwright/test";
import { elements } from "../lib/elements";

async function search(page: Page, value: string) {
  await page.locator("#sb").click();
  await page.locator("#si").fill(value);
  await page.locator("#si").press("Enter");
}

async function answerQuiz(page: Page, correct = true) {
  await expect(page.locator("#qa .opt")).toHaveCount(4);
  const prompt = await page.locator("#qq").innerText();
  const element = elements.find((e) =>
    prompt.startsWith("Which element") ? prompt.includes(e.s + "?") : prompt.includes(e.n + "?"),
  );
  expect(element).toBeTruthy();
  const answer = prompt.startsWith("Symbol")
    ? element!.s
    : prompt.startsWith("Which")
      ? element!.n
      : String(element!.z);
  const options = page.locator("#qa");
  if (correct) await options.getByRole("button", { name: answer, exact: true }).click();
  else {
    const values = await options.locator("button").allTextContents();
    await options
      .getByRole("button", { name: values.find((value) => value !== answer)!, exact: true })
      .click();
  }
  return element!.z;
}

test("reduced motion keeps the quiz visible, interactive and free of entry animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#gb").click();
  await page.locator("#qb").click();
  await expect(page.locator("#qa .opt")).toHaveCount(4);
  await expect(page.locator("#qc")).toHaveCSS("opacity", "1");
  await expect(page.locator("#qc")).toHaveCSS("transform", "none");
  expect(await page.locator("#qc").evaluate((card) => card.getAnimations().length)).toBe(0);
  await answerQuiz(page);
  await expect(page.locator("#qs")).toHaveText("Streak 1");
  await page.locator("#qx").click();
  await expect(page.locator("#qz")).toHaveCount(0);
});

test("quiz flip preserves the prototype's perspective, easing and opacity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const animations: Animation[] = [];
    Object.defineProperty(window, "quizAnimations", { value: animations });
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      const animation = originalAnimate.apply(this, args);
      if (this.id === "qc") {
        animations.push(animation);
        queueMicrotask(() => animation.pause());
      }
      return animation;
    };
  });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#gb").click();
  await page.locator("#qb").click();
  await expect(page.locator("#qa .opt")).toHaveCount(4);
  const result = await page.evaluate(async () => {
    const card = document.querySelector("#qc")!;
    const animations = (window as unknown as { quizAnimations: Animation[] }).quizAnimations.filter(
      (animation) => (animation.effect as KeyframeEffect).target === card,
    );
    const reference = document.createElement("div");
    reference.style.cssText = "position:fixed;left:-10000px;width:300px;height:220px";
    document.body.append(reference);
    // The original prototype's CSS flip, represented as browser-native keyframes.
    const original = reference.animate(
      [
        { transform: "perspective(600px) rotateY(-90deg)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 600, easing: "cubic-bezier(0.34, 1.5, 0.5, 1)", fill: "both" },
    );
    original.pause();
    const samples = [];
    for (const time of [0, 90, 180, 270, 420, 600]) {
      original.currentTime = time;
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = time;
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const actual = getComputedStyle(card),
        expected = getComputedStyle(reference);
      samples.push({
        time,
        actual: { transform: actual.transform, opacity: actual.opacity },
        expected: { transform: expected.transform, opacity: expected.opacity },
      });
    }
    const timings = animations.map((animation) => animation.effect!.getTiming());
    original.cancel();
    reference.remove();
    return { timings, samples };
  });
  expect(result.timings.length).toBeGreaterThan(0);
  for (const timing of result.timings) {
    expect(timing.duration).toBe(600);
    expect(timing.easing).toBe("cubic-bezier(0.34, 1.5, 0.5, 1)");
  }
  for (const sample of result.samples) expect(sample.actual).toEqual(sample.expected);
});

test("3D scene, search, gestures, navigation, details, themes and persistence", async ({
  page,
}, info) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3000/")) external.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#in")).toContainText("Oxygen");
  await page.waitForFunction(
    () => !!(document.querySelector("#gl") as HTMLCanvasElement).getContext("webgl2"),
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `/tmp/elements-next-${info.project.name}.png` });
  await search(page, "Iron");
  await expect(page.locator("#in")).toContainText("Iron");
  await expect(page.locator("#pr")).toContainText("130 XP");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#in")).toContainText("Cobalt");
  const box = (await page.locator("#app").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.55, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator("#in")).toContainText("Nickel");
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await expect(page.locator("#pk")).toHaveClass(/on/);
  await expect(page.locator("#pk")).toContainText("28 protons");
  await page.mouse.up();
  await expect(page.locator("#pk")).not.toHaveClass(/on/);
  await page.locator("#in").click();
  await expect(page.locator("#dbody")).toContainText("58.693");
  await page.locator("#dx").click();
  await page.locator("#mb").click();
  await page.locator('[data-t="dusk"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
  await page.locator("#ab").click();
  await expect(page.locator("#ab")).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("#pr")).toContainText("150 XP");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("el")!).f.includes(25))).toBe(
    true,
  );
  const stageWidth = await page.locator("#app").evaluate((e) => e.clientWidth);
  expect(stageWidth).toBeGreaterThanOrEqual(info.project.name === "mobile" ? 320 : 520);
  expect(stageWidth).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("all 118 table cells, discovery, quiz scoring and closing pending questions", async ({
  page,
}) => {
  // This flow loads several panels and waits for real quiz timers on software WebGL in CI.
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#gb").click();
  await expect(page.locator("#tb .c")).toHaveCount(118);
  await page.locator('#tb [aria-label="Gold"]').click();
  await expect(page.locator("#in")).toContainText("Gold");
  await expect(page.locator("#pr")).toContainText("130 XP");
  await page.locator("#gb").click();
  await page.locator("#qb").click();
  const firstCorrectZ = await answerQuiz(page);
  await expect(page.locator("#qs")).toHaveText("Streak 1");
  await expect(page.locator("#pr")).toContainText("135 XP");
  await page.locator("#qx").click();
  await page.waitForTimeout(1200);
  await expect(page.locator("#qz")).toHaveCount(0);
  await page.locator("#gb").click();
  await page.locator("#qb").click();
  await answerQuiz(page, false);
  await expect(page.locator("#qs")).toHaveText("Streak 0");
  await expect(page.locator("#qa .no")).toHaveCount(1);
  await expect(page.locator("#qa .ok")).toHaveCount(1);
  await expect(page.locator("#pr")).toContainText("135 XP");
  await expect(page.locator("#qa button").first()).toBeEnabled();
  const secondCorrectZ = await answerQuiz(page);
  await expect(page.locator("#qs")).toHaveText("Streak 1");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("#pr")).toContainText(
    `${secondCorrectZ === firstCorrectZ ? 135 : 140} XP`,
  );
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("el")!).s)).toBe(1);
});
