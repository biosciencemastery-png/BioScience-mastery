import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newToken,
  tokenHash,
  rateHash,
  seal,
  unseal,
  matchesSecret,
} from "../../src/features/notifications/security";
import {
  notificationEmail,
  sendNotification,
} from "../../src/features/notifications/email";
test("notification tokens and encrypted outbox resist guessing and tampering", () => {
  const token = newToken(),
    key = "a".repeat(64);
  assert.match(token, /^[\w-]{43}$/);
  assert.notEqual(token, newToken());
  assert.equal(tokenHash(token).length, 64);
  assert.notEqual(rateHash("email", key), rateHash("email", "b".repeat(64)));
  const encrypted = seal({ private: "student@example.test" }, key);
  assert.ok(!encrypted.includes("student"));
  assert.deepEqual(unseal(encrypted, key), { private: "student@example.test" });
  assert.throws(() => unseal(encrypted, "b".repeat(64)));
  assert.throws(() => unseal(encrypted.slice(0, -5) + "AAAAA", key));
  assert.ok(matchesSecret(token, token));
  assert.ok(!matchesSecret(token, "wrong"));
});
for (const locale of ["en", "hi"] as const)
  test(`${locale}: confirmation and launch templates escape content; disabled mail never calls provider`, async () => {
    for (const confirm of ["https://example.test/confirm", undefined]) {
      const mail = notificationEmail({
        locale,
        to: "student@example.test",
        course: "<script>bad</script>",
        confirm,
        unsubscribe: "https://example.test/unsubscribe",
        information: "https://example.test/exams",
      });
      assert.ok(!mail.html.includes("<script>"));
      assert.ok(mail.html.includes(`lang="${locale}"`));
      assert.ok(mail.text.includes("/unsubscribe"));
      let calls = 0;
      const fetcher: typeof fetch = async (_url, options) => {
        calls++;
        assert.equal(
          new Headers(options?.headers).get("Idempotency-Key"),
          "test-job",
        );
        return new Response("{}");
      };
      await assert.rejects(
        sendNotification(mail, {
          enabled: false,
          apiKey: "fixture",
          from: "fixture@example.test",
          jobId: "test-job",
          fetcher,
        }),
      );
      assert.equal(calls, 0);
      await sendNotification(mail, {
        enabled: true,
        apiKey: "fixture",
        from: "fixture@example.test",
        jobId: "test-job",
        fetcher,
      });
      assert.equal(calls, 1);
    }
  });
