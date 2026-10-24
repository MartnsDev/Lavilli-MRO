import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/full",
  timeout: 60000,
  workers: 1,
  fullyParallel: false,
  outputDir: "test-results/full",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/full", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:3100",
    actionTimeout: 15000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "visual",
      testMatch: ["**/visual.spec.ts", "**/keyboard.spec.ts"],
      use: {
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "firefox",
      testMatch: "**/dashboard.spec.ts",
      use: {
        browserName: "firefox",
        channel: undefined,
        viewport: { width: 1366, height: 900 },
      },
    },
    {
      name: "functional-api",
      testMatch: ["**/functional.spec.ts", "**/security.spec.ts"],
    },
    {
      name: "desktop",
      testMatch: "**/dashboard.spec.ts",
      use: {
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      testMatch: "**/dashboard.spec.ts",
      use: {
        ...devices["Pixel 7"],
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
