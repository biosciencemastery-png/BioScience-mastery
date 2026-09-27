import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Windows browser cold starts need more time on the local development machine.
  timeout: process.platform === "win32" ? 90_000 : 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/en",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ALLOW_INDEXING: "false" },
  },
});
