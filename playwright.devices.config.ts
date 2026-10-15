import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./device-tests",
  outputDir: "device-results",
  reporter: [["list"], ["html", { outputFolder: "device-report", open: "never" }]],
  retries: process.env.CI ? 1 : 0,
  timeout: 40_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "android-chromium",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
          args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        },
      },
    },
    { name: "ios-webkit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
