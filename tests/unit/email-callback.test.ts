import test from "node:test";
import assert from "node:assert/strict";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  completeEmailCallback,
  parseEmailCallback,
} from "../../src/lib/auth/email-callback";
import { sessionCookieOptions } from "../../src/lib/supabase/cookie-options";

function fixture() {
  const jar = new Map<string, { value: string; options: CookieOptions }>();
  const requests: { path: string; body: Record<string, string> }[] = [];
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const jwt =
    [
      { alg: "HS256", typ: "JWT" },
      {
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "authenticated",
      },
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString("base64url"))
      .join(".") + ".fixture";
  const make = () =>
    createServerClient("https://test.supabase.co", "sb_publishable_fixture", {
      cookieOptions: sessionCookieOptions("https://preview.example.com"),
      cookies: {
        getAll: () => Array.from(jar, ([name, { value }]) => ({ name, value })),
        setAll: (values) =>
          values.forEach(({ name, value, options }) => {
            if (!value) jar.delete(name);
            else jar.set(name, { value, options });
          }),
      },
      global: {
        fetch: async (url, init) => {
          const path = new URL(String(url)).pathname;
          const body = JSON.parse(String(init?.body ?? "{}"));
          requests.push({ path, body });
          if (path.endsWith("/signup"))
            return Response.json({ user, session: null });
          if (path.endsWith("/recover") || path.endsWith("/logout"))
            return Response.json({});
          if (path.endsWith("/user")) return Response.json(user);
          if (
            body.auth_code?.startsWith("expired") ||
            body.token_hash?.startsWith("expired")
          )
            return Response.json(
              { code: "otp_expired", msg: "Expired fixture" },
              { status: 400 },
            );
          if (path.endsWith("/token") || path.endsWith("/verify"))
            return Response.json({
              access_token: jwt,
              refresh_token: "fixture-refresh",
              expires_in: 3600,
              token_type: "bearer",
              user,
            });
          throw new Error("Unexpected fixture request");
        },
      },
    });
  return { jar, requests, make };
}
for (const locale of ["en", "hi"] as const)
  for (const recovery of [false, true]) {
    test(`${locale}: PKCE ${recovery ? "recovery" : "signup"} persists secure cookies and restores session`, async () => {
      const f = fixture(),
        client = f.make();
      if (recovery) await client.auth.resetPasswordForEmail("test@example.com");
      else
        await client.auth.signUp({
          email: "test@example.com",
          password: "long-test-password",
        });
      assert.ok(
        Array.from(f.jar.keys()).some((k) => k.includes("code-verifier")),
      );
      const destination = await completeEmailCallback(
        f.make(),
        { kind: "pkce", code: "a".repeat(40) },
        locale,
      );
      assert.equal(
        destination,
        recovery
          ? `/${locale}/reset-password`
          : `/${locale}/account?notice=verified`,
      );
      assert.ok(
        f.requests.find((r) => r.path.endsWith("/token"))?.body.code_verifier,
      );
      assert.equal(f.jar.has("sb-test-auth-token-code-verifier"), false);
      for (const cookie of f.jar.values()) {
        assert.equal(cookie.options.httpOnly, true);
        assert.equal(cookie.options.secure, true);
        assert.equal(cookie.options.sameSite, "lax");
      }
      assert.equal(
        (await f.make().auth.getUser()).data.user?.email,
        "test@example.com",
      );
      assert.equal(
        await completeEmailCallback(
          f.make(),
          { kind: "pkce", code: "a".repeat(40) },
          locale,
        ),
        null,
      );
      await f.make().auth.signOut({ scope: "local" });
      assert.equal(f.jar.has("sb-test-auth-token"), false);
    });
    test(`${locale}: token hash ${recovery ? "recovery" : "signup"} is preserved`, async () => {
      const f = fixture();
      assert.equal(
        await completeEmailCallback(
          f.make(),
          {
            kind: "token",
            token_hash: "a".repeat(64),
            type: recovery ? "recovery" : "signup",
          },
          locale,
        ),
        recovery
          ? `/${locale}/reset-password`
          : `/${locale}/account?notice=verified`,
      );
    });
  }
test("expired codes and missing verifier fail without creating a session", async () => {
  const f = fixture();
  assert.equal(
    await completeEmailCallback(
      f.make(),
      { kind: "pkce", code: "a".repeat(40) },
      "en",
    ),
    null,
  );
  assert.equal(f.requests.length, 0);
  await f.make().auth.resetPasswordForEmail("test@example.com");
  assert.equal(
    await completeEmailCallback(
      f.make(),
      { kind: "pkce", code: "expired" + "a".repeat(40) },
      "en",
    ),
    null,
  );
  assert.equal(f.jar.has("sb-test-auth-token"), false);
});
test("invalid, duplicate, mixed and provider-error links are rejected; next/flow cannot select routing", () => {
  for (const input of [
    {},
    { code: "bad" },
    { code: ["a".repeat(40), "b".repeat(40)] },
    { code: "a".repeat(40), token_hash: "a".repeat(64), type: "signup" },
    { code: "a".repeat(40), error: "access_denied" },
  ])
    assert.equal(parseEmailCallback(input), null);
  assert.deepEqual(
    parseEmailCallback({
      code: "a".repeat(40),
      flow: "recovery",
      next: "https://evil.example",
    }),
    { kind: "pkce", code: "a".repeat(40) },
  );
});
