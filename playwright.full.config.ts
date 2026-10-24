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
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "functional-api", testMatch: "**/functional.spec.ts" },
    {
      name: "desktop",
      testMatch: "**/dashboard.spec.ts",
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile",
      testMatch: "**/dashboard.spec.ts",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
});
