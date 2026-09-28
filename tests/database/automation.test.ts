import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { automationDatabase, identities } from "../helpers/automation-db";
let db: PGlite;
before(async () => {
  db = await automationDatabase();
});
after(async () => {
  await db.close();
});
async function asRole<T>(
  role: keyof typeof identities | "anon",
  fn: () => Promise<T>,
) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    role === "anon" ? "" : identities[role],
  ]);
  await db.exec(`set role ${role === "anon" ? "anon" : "authenticated"}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function command(command: string, payload: Record<string, unknown> = {}) {
  return (
    await db.query<{ result: Record<string, unknown> }>(
      "select public.automation_command($1,$2) result",
      [command, payload],
    )
  ).rows[0].result;
}
async function fixture() {
  await db.exec(
    "insert into private.automation_allowed_origins values('https://official.example.org','Isolated synthetic test origin only') on conflict do nothing; update private.automation_config set manual_collection_enabled=true",
  );
  const exam = (
    await db.query<{ id: string }>("select id from public.examinations limit 1")
  ).rows[0].id;
  const source = await asRole("admin", () =>
    command("source", {
      examination_id: exam,
      name: "Synthetic official fixture",
      url: `https://official.example.org/${randomUUID()}`,
      source_type: "notice",
      active: true,
      verification_status: "verified",
      verification_notes: "Synthetic fixture review only",
      licensing_notes: "Original fixture text; test use",
    }),
  );
  return source.id as string;
}
async function capture(
  source: string,
  text: string,
  key = randomUUID(),
  outcome = "complete",
) {
  return asRole("admin", async () => {
    const job = await command("claim", {
      source_id: source,
      idempotency_key: key,
    });
    if (job.finished) return job;
    return command(outcome, {
      job_id: job.id,
      lease_token: job.lease_token,
      text,
      language: "en",
    });
  });
}
async function review(id: unknown) {
  return (
    await db.query<{
      version: number;
      status: string;
      current_revision_id: string;
    }>("select * from public.automation_reviews where id=$1", [id])
  ).rows[0];
}
test("automation defaults off; anonymous and students cannot read data or call staff RPCs", async () => {
  const config = (
    await db.query<{
      manual_collection_enabled: boolean;
      publication_enabled: boolean;
    }>("select * from private.automation_config")
  ).rows[0];
  assert.equal(config.manual_collection_enabled, false);
  assert.equal(config.publication_enabled, false);
  await asRole("anon", async () => {
    await assert.rejects(
      db.query("select * from public.automation_sources"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.automation_dashboard()"),
      /permission denied/,
    );
  });
  await asRole("student", async () => {
    assert.equal(
      (await db.query("select * from public.automation_reviews")).rows.length,
      0,
    );
    await assert.rejects(command("source"), /staff access required/);
    await assert.rejects(
      db.query("select public.automation_dashboard()"),
      /staff access required/,
    );
  });
});
test("operator allowlist and administrator boundaries cannot be bypassed", async () => {
  await asRole("editor", async () => {
    await assert.rejects(command("source"), /Administrator/);
    await assert.rejects(
      db.query(
        "update private.automation_config set manual_collection_enabled=true",
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "insert into public.user_roles(user_id,role) values(auth.uid(),'admin')",
      ),
      /permission denied/,
    );
  });
  await asRole("admin", () =>
    assert.rejects(
      command("source", { url: "https://unapproved.example.org" }),
      /operator approval/,
    ),
  );
});
test("fingerprinting normalizes line endings, deduplicates unchanged content and replays idempotently", async () => {
  const source = await fixture(),
    key = randomUUID();
  const first = await capture(
    source,
    "A real fixture\r\nwithout invented dates",
    key,
  );
  assert.equal(first.result, "initial");
  assert.equal(
    (await capture(source, "This must not replace original evidence", key))
      .finished,
    true,
  );
  assert.equal(
    (await capture(source, "A real fixture\nwithout invented dates")).result,
    "unchanged",
  );
  const changed = await capture(
    source,
    "A changed fixture; no examination claim",
  );
  assert.equal(changed.result, "changed");
  const rows = (
    await db.query<{
      fingerprint: string;
      previous_fingerprint: string;
      excerpt: string;
    }>(
      "select * from public.automation_evidence where source_id=$1 order by retrieved_at",
      [source],
    )
  ).rows;
  assert.equal(rows.length, 2);
  assert.equal(
    rows[0].fingerprint,
    createHash("sha256")
      .update("A real fixture\nwithout invented dates")
      .digest("hex"),
  );
  assert.equal(rows[1].previous_fingerprint, rows[0].fingerprint);
  const s = (
    await db.query<{ last_checked_at: string; last_success_at: string }>(
      "select * from public.automation_sources where id=$1",
      [source],
    )
  ).rows[0];
  assert.ok(s.last_checked_at);
  assert.ok(s.last_success_at);
});
test("leases enforce ownership, expiry, retry limits and kill switch", async () => {
  const source = await fixture(),
    key = randomUUID();
  const job = await asRole("admin", () =>
    command("claim", { source_id: source, idempotency_key: key }),
  );
  await asRole("admin", () =>
    assert.rejects(
      command("claim", { source_id: source, idempotency_key: key }),
      /unavailable/,
    ),
  );
  await asRole("admin", () =>
    assert.rejects(
      command("complete", {
        job_id: job.id,
        lease_token: randomUUID(),
        text: "test",
        language: "en",
      }),
      /lease/,
    ),
  );
  await db.query(
    "update public.automation_jobs set lease_until=now()-interval '1 minute' where id=$1",
    [job.id],
  );
  await asRole("admin", () =>
    assert.rejects(
      command("complete", {
        job_id: job.id,
        lease_token: job.lease_token,
        text: "test",
        language: "en",
      }),
      /lease/,
    ),
  );
  assert.equal(
    (await capture(source, "temporary retrieval failure", key, "failure"))
      .result,
    "retrieval_failure",
  );
  assert.equal(
    (await capture(source, "repeat retrieval failure", key, "failure")).result,
    "retrieval_failure",
  );
  await assert.rejects(capture(source, "attempt four", key), /retry limit/);
  await db.exec(
    "update private.automation_config set manual_collection_enabled=false",
  );
  await assert.rejects(capture(source, "disabled"), /kill switch/);
  await db.exec(
    "update private.automation_config set manual_collection_enabled=true",
  );
});
test("review to approval preserves immutable evidence, revisions and decisions; edits invalidate approval", async () => {
  const source = await fixture(),
    result = await capture(
      source,
      "Synthetic licensing-safe evidence for workflow testing",
    ),
    id = result.review_id;
  await asRole("editor", () =>
    assert.rejects(
      command("draft", { id, version: 1 }),
      /Verified evidence required/,
    ),
  );
  await asRole("editor", () =>
    command("triage", {
      id,
      version: 1,
      status: "verified",
      category: "deadline_change",
      notes: "Human reviewed the original fixture; no real date asserted",
    }),
  );
  const draft = {
    id,
    version: 2,
    title: "Fixture summary",
    body: "Original synthetic test summary only",
    language: "hi",
    licensing_notes: "Owned fixture material",
    rights_confirmed: true,
  };
  await asRole("editor", () => command("draft", draft));
  await asRole("editor", () =>
    assert.rejects(
      command("approve", { id, version: 3, notes: "An editor cannot approve" }),
      /Administrator/,
    ),
  );
  await asRole("admin", () =>
    command("approve", {
      id,
      version: 3,
      notes: "Human reviewed this exact revision",
    }),
  );
  const approved = await review(id);
  assert.equal(approved.status, "approved");
  await asRole("admin", () =>
    assert.rejects(
      command("publish", {
        id,
        version: 4,
        notes: "Publication remains disabled",
      }),
      /kill switch/,
    ),
  );
  await asRole("editor", () =>
    assert.rejects(command("draft", draft), /changed; reload/),
  );
  await asRole("editor", () =>
    command("draft", {
      ...draft,
      version: 4,
      body: "Revised original synthetic summary only",
    }),
  );
  assert.equal((await review(id)).status, "draft");
  const decisions = (
    await db.query<{ revision_id: string }>(
      "select * from public.automation_decisions where review_id=$1",
      [id],
    )
  ).rows;
  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].revision_id, approved.current_revision_id);
  assert.equal(
    (
      await db.query(
        "select * from public.automation_revisions where review_id=$1",
        [id],
      )
    ).rows.length,
    2,
  );
  for (const table of [
    "automation_evidence",
    "automation_revisions",
    "automation_decisions",
    "automation_history",
  ])
    await asRole("admin", () =>
      assert.rejects(
        db.query(`delete from public.${table}`),
        /permission denied/,
      ),
    );
  assert.ok(
    (
      await db.query(
        "select * from public.automation_history where entity_id=$1",
        [id],
      )
    ).rows.length >= 5,
  );
});
test("failure evidence cannot become a verified examination notice; report stays zero-cost and private", async () => {
  const source = await fixture(),
    result = await capture(
      source,
      "Manual failed retrieval report",
      randomUUID(),
      "failure",
    );
  await asRole("editor", () =>
    assert.rejects(
      command("triage", {
        id: result.review_id,
        version: 1,
        status: "verified",
        category: "notice",
        notes: "Cannot verify a failed retrieval",
      }),
      /Failure cannot verify/,
    ),
  );
  await asRole("editor", async () => {
    const d = (
      await db.query<{
        d: {
          actual_cost: number;
          report: { actual_cost: number; cadence: string };
          external_ai_enabled: boolean;
          scheduler_enabled: boolean;
          delivery_enabled: boolean;
        };
      }>("select public.automation_dashboard() d")
    ).rows[0].d;
    assert.equal(d.actual_cost, 0);
    assert.equal(d.report.actual_cost, 0);
    assert.equal(d.report.cadence, "DAILY");
    assert.equal(d.external_ai_enabled, false);
    assert.equal(d.scheduler_enabled, false);
    assert.equal(d.delivery_enabled, false);
  });
  await asRole("student", async () => {
    for (const t of [
      "automation_sources",
      "automation_jobs",
      "automation_evidence",
      "automation_reviews",
      "automation_revisions",
      "automation_decisions",
      "automation_history",
    ])
      assert.equal(
        (await db.query(`select * from public.${t}`)).rows.length,
        0,
      );
  });
});
