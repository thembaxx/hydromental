import { expect, test } from "./fixtures";

test.use({ serviceWorkers: "block" });

test("Sound Lab clips load after opt-in and mute stops active sample playback", async ({
  page,
}) => {
  const errors: string[] = [];
  const downloads: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/sounds/")) downloads.push(request.url());
  });
  await page.addInitScript(() => {
    const readings = { decoded: 0, starts: 0, stops: 0 };
    Object.defineProperty(window, "soundReadings", { value: readings });
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (data) {
      return decode.call(this, data).then((buffer) => {
        readings.decoded += 1;
        return buffer;
      });
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function () {
      readings.starts += 1;
      return start.call(this);
    };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function () {
      readings.stops += 1;
      return stop.call(this);
    };
  });
  const readings = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            soundReadings: { decoded: number; starts: number; stops: number };
          }
        ).soundReadings,
    );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  expect(downloads).toEqual([]);
  expect((await readings()).starts).toBe(0);
  await page.getByRole("button", { name: "Unmute sound effects", exact: true }).click();
  await expect.poll(async () => (await readings()).decoded).toBe(7);
  expect(downloads).toHaveLength(7);
  await page.getByRole("button", { name: "Quantum Cloud", exact: true }).click();
  await expect.poll(async () => (await readings()).starts).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Mute sound effects", exact: true }).click();
  await expect.poll(async () => (await readings()).stops).toBeGreaterThan(0);
  const mutedStarts = (await readings()).starts;
  await page.getByRole("button", { name: "Crystal & Matter", exact: true }).click();
  expect((await readings()).starts).toBe(mutedStarts);
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
  expect((await readings()).starts).toBe(0);
  expect(errors).toEqual([]);
});
