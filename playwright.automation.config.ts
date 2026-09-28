import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const servers = base.webServer as {
  command: string;
  url: string;
  reuseExistingServer: boolean;
  timeout: number;
  env?: Record<string, string>;
}[];
export default defineConfig({
  ...base,
  testMatch: "automation.spec.ts",
  webServer: [
    {
      ...servers[0],
      command:
        "node node_modules/tsx/dist/cli.mjs scripts/automation-fixture.ts",
    },
    {
      ...servers[1],
      env: {
        ...servers[1].env,
        AUTOMATION_ENV: "development",
        AUTOMATION_MANUAL_ENABLED: "true",
      },
    },
  ],
});
