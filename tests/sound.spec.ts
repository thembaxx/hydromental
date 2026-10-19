import { expect, test } from "./fixtures";

test.use({ serviceWorkers: "block" });

for (const surface of ["explorer", "atom study"] as const)
  test(`${surface}: Sound Lab clips load after opt-in and mute stops active sample playback`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const downloads: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("/sounds/")) downloads.push(request.url());
    });
    await page.addInitScript(() => {
      const readings = { decoded: 0, starts: 0, stops: 0, vibrations: 0 };
      Object.defineProperty(window, "soundReadings", { value: readings });
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: () => {
          readings.vibrations += 1;
          return true;
        },
      });
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
              soundReadings: { decoded: number; starts: number; stops: number; vibrations: number };
            }
          ).soundReadings,
      );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(surface === "explorer" ? "/" : "/elements/oxygen");
    if (surface === "explorer")
      await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
    else await expect(page.locator(".atom-study-renderer canvas")).toBeVisible();
    expect(downloads).toEqual([]);
    expect((await readings()).starts).toBe(0);
    await page
      .getByRole("button", {
        name: surface === "explorer" ? "Unmute sound effects" : "Enable atom sounds",
        exact: true,
      })
      .click();
    await expect.poll(async () => (await readings()).decoded).toBe(7);
    expect(downloads).toHaveLength(7);
    if (surface === "atom study") {
      await page.getByRole("button", { name: "Pause atom animation", exact: true }).click();
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    await page
      .getByRole("button", {
        name: surface === "explorer" ? "Quantum Cloud" : "Excite 3D atom",
        exact: true,
      })
      .click();
    await expect.poll(async () => (await readings()).starts).toBeGreaterThan(0);
    if (surface === "atom study") expect((await readings()).vibrations).toBe(0);
    await page
      .getByRole("button", {
        name: surface === "explorer" ? "Mute sound effects" : "Mute atom sounds",
        exact: true,
      })
      .click();
    await expect.poll(async () => (await readings()).stops).toBeGreaterThan(0);
    const mutedStarts = (await readings()).starts;
    await page
      .getByRole("button", {
        name: surface === "explorer" ? "Crystal & Matter" : "Spread electron shells",
        exact: true,
      })
      .click();
    expect((await readings()).starts).toBe(mutedStarts);
    await page.reload();
    if (surface === "explorer")
      await expect(page.locator("#app")).toHaveAttribute("data-ready", "true");
    else await expect(page.locator(".atom-study-renderer canvas")).toBeVisible();
    expect((await readings()).starts).toBe(0);
    expect(errors).toEqual([]);
  });
