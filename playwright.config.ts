import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.DSH_TEST_URL ?? "http://127.0.0.1:3080",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
