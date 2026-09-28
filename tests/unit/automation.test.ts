import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sourceUrl,
  manualCollectionAllowed,
  importantAlert,
  assessAiRequest,
  aiPolicy,
  commandSchema,
} from "../../src/features/automation/model";
test("automation rejects unsafe URLs and incomplete server-side mutations", () => {
  for (const url of [
    "http://official.example.org",
    "https://127.0.0.1",
    "https://localhost",
    "https://host.internal",
    "https://user:pass@example.org",
    "https://example.org/?token=secret",
    "https://example.org/#fragment",
    "https://example.org:8080",
    "https://example.org/../private",
  ])
    assert.equal(sourceUrl.safeParse(url).success, false, url);
  assert.equal(
    sourceUrl.safeParse("https://official.example.org/notices/latest.pdf")
      .success,
    true,
  );
  assert.equal(
    commandSchema.safeParse({ command: "draft", id: "invalid" }).success,
    false,
  );
  assert.equal(commandSchema.safeParse({ command: "publish" }).success, false);
});
test("manual collection requires explicit local Development gates", () => {
  const enabled = {
    AUTOMATION_ENV: "development",
    AUTOMATION_MANUAL_ENABLED: "true",
    SITE_URL: "http://localhost:3000",
  };
  assert.equal(manualCollectionAllowed({}), false);
  assert.equal(manualCollectionAllowed(enabled), true);
  assert.equal(
    manualCollectionAllowed({ ...enabled, VERCEL_ENV: "production" }),
    false,
  );
  assert.equal(
    manualCollectionAllowed({ ...enabled, VERCEL_ENV: "preview" }),
    false,
  );
  assert.equal(
    manualCollectionAllowed({
      ...enabled,
      SITE_URL: "https://biosciencemasterycom.vercel.app",
    }),
    false,
  );
});
test("important alerts require explicit category and deadline verification; routine work is quiet", () => {
  assert.equal(
    importantAlert({
      category: "notice",
      verified_at: null,
      status: "detected",
    }),
    null,
  );
  assert.equal(
    importantAlert({
      category: "deadline_change",
      verified_at: null,
      status: "needs_review",
    }),
    null,
  );
  assert.equal(
    importantAlert({
      category: "deadline_change",
      verified_at: "2026-09-30",
      status: "verified",
    }),
    "verified_deadline_change",
  );
  assert.equal(
    importantAlert({
      category: "security_incident",
      verified_at: null,
      status: "detected",
    }),
    "security_incident",
  );
  assert.equal(
    importantAlert({
      category: "owner_approval",
      verified_at: null,
      status: "draft",
    }),
    "owner_approval",
  );
  assert.equal(
    importantAlert({
      category: "deadline_change",
      verified_at: "2026-09-30",
      status: "rejected",
    }),
    null,
  );
});
test("AI boundary denies private or licensed unpublished data and has no enabled or paid path", () => {
  for (const classification of [
    "password",
    "private_profile",
    "consent_record",
    "unpublished_licensed_material",
  ])
    assert.deepEqual(
      assessAiRequest({ classification, cacheKey: "x", estimatedCost: 0 }),
      { allowed: false, reason: "restricted_data" },
    );
  assert.equal(
    assessAiRequest({
      classification: "verified_public_licensed_evidence",
      cacheKey: "sha256:fixture",
      estimatedCost: 0,
    }).allowed,
    false,
  );
  assert.equal(aiPolicy.enabled, false);
  assert.equal(
    aiPolicy.approvedBudget +
      aiPolicy.perRequestLimit +
      aiPolicy.dailyBudget +
      aiPolicy.monthlyBudget,
    0,
  );
});
