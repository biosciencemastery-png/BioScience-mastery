import test from "node:test";
import assert from "node:assert/strict";
import { authConfig, confirmationUrl } from "../../src/lib/auth/config";
import {
  emailSchema,
  passwordSchema,
  confirmationSchema,
  registrationSchema,
} from "../../src/lib/auth/validation";
const valid = {
  AUTH_ENABLED: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
  SITE_URL: "http://localhost:3000",
};
test("auth fails closed until enabled and all required values are valid", () => {
  assert.equal(authConfig({}), null);
  assert.equal(authConfig({ ...valid, AUTH_ENABLED: "false" }), null);
  assert.ok(authConfig(valid));
  for (const key of ["", "sb_secret_do_not_expose", "eyJlegacy-service-role"])
    assert.equal(
      authConfig({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }),
      null,
    );
  for (const site of [
    "http://untrusted.example",
    "https://example.com/path",
    "https://a:b@example.com",
    "https://example.com?next=evil",
  ])
    assert.equal(authConfig({ ...valid, SITE_URL: site }), null);
});
test("confirmation destinations are fixed and locale-specific", () => {
  assert.equal(
    confirmationUrl("https://biosciencemasterycom.vercel.app", "hi"),
    "https://biosciencemasterycom.vercel.app/hi/auth/confirm",
  );
});
test("credentials and confirmation inputs are validated", () => {
  assert.equal(
    emailSchema.parse(" Learner@Example.com "),
    "learner@example.com",
  );
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(passwordSchema.safeParse("x".repeat(129)).success, false);
  assert.equal(
    confirmationSchema.safeParse({ type: "invite", token_hash: "a".repeat(64) })
      .success,
    false,
  );
  assert.equal(
    confirmationSchema.safeParse({ type: "signup", token_hash: "bad\nvalue" })
      .success,
    false,
  );
  const result = registrationSchema.parse({
    email: "a@example.com",
    password: "long-test-password",
    display_name: "Learner",
    locale: "en",
    role: "admin",
  });
  assert.equal("role" in result, false);
});
