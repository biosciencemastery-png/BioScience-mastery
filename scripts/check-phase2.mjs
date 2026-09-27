import { spawnSync } from "node:child_process";

// Test fixtures only: never contact the hosted project or consume real credentials.
const env = {
  ...process.env,
  AUTH_ENABLED: "true",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture_only",
  SITE_URL: "http://127.0.0.1:3000",
  ALLOW_INDEXING: "false",
};
for (const task of [
  "format:check",
  "lint",
  "typecheck",
  "test:unit",
  "test:db",
  "build",
  "test",
]) {
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", task],
    { env, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
