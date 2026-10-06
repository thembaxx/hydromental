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
}

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
  expect(await page.locator("#app").evaluate((e) => e.clientWidth)).toBe(
    info.project.name === "mobile" ? 390 : 520,
  );
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("all 118 table cells, discovery, quiz scoring and closing pending questions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  await page.locator("#gb").click();
  await expect(page.locator("#tb .c")).toHaveCount(118);
  await page.locator('#tb [aria-label="Gold"]').click();
  await expect(page.locator("#in")).toContainText("Gold");
  await expect(page.locator("#pr")).toContainText("130 XP");
  await page.locator("#gb").click();
  await page.locator("#qb").click();
  await answerQuiz(page);
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
  await answerQuiz(page);
  await expect(page.locator("#qs")).toHaveText("Streak 1");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("#pr")).toContainText("140 XP");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("el")!).s)).toBe(1);
});
