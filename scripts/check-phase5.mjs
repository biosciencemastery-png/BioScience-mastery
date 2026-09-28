import { spawnSync } from "node:child_process";
const env = {
  ...process.env,
  AUTH_ENABLED: "true",
  REGISTRATION_ENABLED: "false",
  CATALOGUE_ENABLED: "true",
  NOTIFICATIONS_ENABLED: "false",
  EMAIL_DELIVERY_ENABLED: "false",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture_only",
  SITE_URL: "http://127.0.0.1:3000",
  ALLOW_INDEXING: "false",
  AUTOMATION_ENV: "disabled",
  AUTOMATION_MANUAL_ENABLED: "false",
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const task of [
  "format:check",
  "lint",
  "typecheck",
  "test:unit",
  "test:db",
  "build",
  "test:automation",
]) {
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", task],
    { env, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
