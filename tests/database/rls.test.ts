import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
before(async () => {
  // Reproduce Supabase's auth boundary in an isolated PostgreSQL engine; no hosted writes.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to anon, authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
    insert into auth.users values ('${alice}', '{"display_name":"Alice","role":"admin"}');`);
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    // Existing Phase 2 users predate the closed Phase 4 signup gate.
    if (file === "202609290001_student_profiles_and_legal.sql")
      await db.query(
        "insert into auth.users(id,raw_user_meta_data) values ($1,$2)",
        [bob, { display_name: "Bob", locale: "hi", role: "admin" }],
      );
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  }
});
after(async () => {
  await db.close();
});
test("Phase 4 direct Auth signups stay closed even when the browser is bypassed", async () => {
  await assert.rejects(
    db.query(
      "insert into auth.users(id) values ('00000000-0000-4000-8000-000000000099')",
    ),
    /Registration is not open/,
  );
  assert.equal(
    (
      await db.query(
        "select * from public.profiles where id='00000000-0000-4000-8000-000000000099'",
      )
    ).rows.length,
    0,
  );
});
test("Phase 4 signup atomically captures current consent and profile without trusting elevated roles", async () => {
  await db.exec("begin");
  try {
    await db.exec("update private.registration_config set enabled=true");
    const policies = await db.query<{ id: string }>(
      "insert into public.legal_policy_versions(kind,locale,version,body,status,effective_at,reviewed_at,is_current) values ('terms','en','test-only','Test terms','published',now(),now(),true),('privacy','en','test-only','Test privacy','published',now(),now(),true) returning id",
    );
    const {
      rows: [exam],
    } = await db.query<{ id: string }>(
      "select id from public.examinations where slug='gat-b'",
    );
    const uid = "00000000-0000-4000-8000-000000000099";
    const metadata = {
      display_name: "Test",
      locale: "en",
      role: "admin",
      student_registration: {
        terms: true,
        privacy: true,
        terms_version: policies.rows[0].id,
        privacy_version: policies.rows[1].id,
        details: { qualification: "Test qualification" },
        exam_ids: [exam.id],
        target_year: 2027,
        marketing: false,
      },
    };
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
      [uid, metadata],
    );
    assert.equal(
      (
        await db.query(
          "select * from public.student_legal_acceptances where user_id=$1",
          [uid],
        )
      ).rows.length,
      2,
    );
    assert.deepEqual(
      (
        await db.query("select role from public.user_roles where user_id=$1", [
          uid,
        ])
      ).rows,
      [{ role: "student" }],
    );
    assert.equal(
      (
        await db.query(
          "select * from public.student_exam_goals where user_id=$1",
          [uid],
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query<{ raw_user_meta_data: Record<string, unknown> }>(
          "select raw_user_meta_data from auth.users where id=$1",
          [uid],
        )
      ).rows[0].raw_user_meta_data.student_registration,
      undefined,
    );
    await assert.rejects(
      db.query(
        "update public.legal_policy_versions set body='changed' where id=$1",
        [policies.rows[0].id],
      ),
      /immutable/,
    );
  } finally {
    await db.exec("rollback");
  }
});
test("Phase 4 missing consent rolls back the entire Auth signup", async () => {
  await db.exec("begin");
  try {
    await db.exec("update private.registration_config set enabled=true");
    await assert.rejects(
      db.query(
        "insert into auth.users(id,raw_user_meta_data) values ('00000000-0000-4000-8000-000000000099',$1)",
        [
          {
            locale: "en",
            student_registration: {
              details: {},
              exam_ids: [],
              marketing: false,
            },
          },
        ],
      ),
      /consent|Consent/,
    );
  } finally {
    await db.exec("rollback");
  }
  assert.equal(
    (
      await db.query(
        "select * from public.profiles where id='00000000-0000-4000-8000-000000000099'",
      )
    ).rows.length,
    0,
  );
});
test("Phase 4 profile RPC is own-user only; legal acceptance records are not client-writable", async () => {
  await asUser("authenticated", alice, async () => {
    const {
      rows: [exam],
    } = await db.query<{ id: string }>(
      "select id from public.examinations where slug='gat-b'",
    );
    await db.query("select public.save_student_details($1,$2,2027,false)", [
      { qualification: "MSc" },
      [exam.id],
    ]);
    assert.deepEqual(
      (await db.query("select user_id from public.student_academic_profiles"))
        .rows,
      [{ user_id: alice }],
    );
    assert.deepEqual(
      (await db.query("select user_id from public.student_exam_goals")).rows,
      [{ user_id: alice }],
    );
    await assert.rejects(
      db.query(
        "insert into public.student_legal_acceptances(user_id,policy_id) values($1,$1)",
        [alice],
      ),
      /permission denied/,
    );
  });
  await asUser("anon", "", async () => {
    await assert.rejects(
      db.query("select public.save_student_details('{}','{}',null,false)"),
      /permission denied/,
    );
  });
  await asUser("authenticated", alice, async () => {
    await assert.rejects(
      db.query(
        "select public.save_student_details('{\"password\":\"bad\"}','{}',null,false)",
      ),
      /Invalid/,
    );
  });
});
test("launch subscriptions require confirmation, preserve unsubscribe links and queue only published courses", async () => {
  await db.exec("begin");
  try {
    const {
      rows: [course],
    } = await db.query<{ id: string }>(
      "select id from public.courses where slug='gat-b'",
    );
    const request = () =>
      db.query<{ ok: boolean }>(
        "select public.request_launch_notification($1,$2,'hi',$3,$4,'encrypted-fixture',$5,$6) ok",
        [
          course.id,
          "student@example.test",
          "a".repeat(64),
          "b".repeat(64),
          "c".repeat(64),
          "d".repeat(64),
        ],
      );
    assert.equal((await request()).rows[0].ok, true);
    assert.equal((await request()).rows[0].ok, false);
    const {
      rows: [sub],
    } = await db.query<{ id: string; status: string }>(
      "select id,status from public.course_interest_subscriptions where email_normalized='student@example.test'",
    );
    assert.equal(sub.status, "pending");
    assert.equal(
      (await db.query("select * from public.launch_notification_candidates()"))
        .rows.length,
      0,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.confirm_launch_notification($1) ok",
          ["wrong"],
        )
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.confirm_launch_notification($1) ok",
          ["a".repeat(64)],
        )
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.confirm_launch_notification($1) ok",
          ["a".repeat(64)],
        )
      ).rows[0].ok,
      false,
    );
    const queue = () =>
      db.query<{ ok: boolean }>(
        "select public.queue_course_launch($1,$2,'encrypted-launch') ok",
        [sub.id, "e".repeat(64)],
      );
    assert.equal((await queue()).rows[0].ok, false);
    await db.query(
      "update public.courses set launch_status='published' where id=$1",
      [course.id],
    );
    assert.equal(
      (await db.query("select * from public.launch_notification_candidates()"))
        .rows.length,
      1,
    );
    assert.equal((await queue()).rows[0].ok, true);
    assert.equal((await queue()).rows[0].ok, false);
    assert.equal(
      (await db.query("select * from public.launch_notification_candidates()"))
        .rows.length,
      0,
    );
    const {
      rows: [job],
    } = await db.query<{ id: string; lease_id: string }>(
      "select * from public.claim_notification_job()",
    );
    assert.ok(job.id);
    assert.equal(
      (await db.query("select * from public.claim_notification_job()")).rows
        .length,
      0,
    );
    await db.query("select public.finish_notification_job($1,$2,true)", [
      job.id,
      "00000000-0000-4000-8000-000000000000",
    ]);
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from public.notification_outbox where id=$1",
          [job.id],
        )
      ).rows[0].status,
      "processing",
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.unsubscribe_launch_notification($1) ok",
          ["b".repeat(64)],
        )
      ).rows[0].ok,
      true,
    );
    await db.query("select public.finish_notification_job($1,$2,true)", [
      job.id,
      job.lease_id,
    ]);
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from public.notification_outbox where id=$1",
          [job.id],
        )
      ).rows[0].status,
      "cancelled",
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.unsubscribe_launch_notification($1) ok",
          ["e".repeat(64)],
        )
      ).rows[0].ok,
      true,
    );
  } finally {
    await db.exec("rollback");
  }
});
test("expired confirmation and email flood protection fail closed", async () => {
  await db.exec("begin");
  try {
    const {
      rows: [c],
    } = await db.query<{ id: string }>(
      "select id from public.courses where slug='gat-b'",
    );
    const request = () =>
      db.query<{ ok: boolean }>(
        "select public.request_launch_notification($1,'expiry@example.test','en',$2,$3,'fixture',$4,$5) ok",
        [c.id, "1".repeat(64), "2".repeat(64), "3".repeat(64), "4".repeat(64)],
      );
    assert.equal((await request()).rows[0].ok, true);
    await db.exec(
      "update public.course_interest_subscriptions set confirmation_expires_at=now()-interval '1 minute'",
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.confirm_launch_notification($1) ok",
          ["1".repeat(64)],
        )
      ).rows[0].ok,
      false,
    );
    for (let i = 0; i < 4; i++) await request();
    assert.equal(
      (
        await db.query<{ requests: number }>(
          "select requests from public.notification_rate_limits where bucket=$1",
          ["email:" + "3".repeat(64)],
        )
      ).rows[0].requests,
      5,
    );
    assert.equal(
      (await db.query("select * from public.notification_outbox")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.claim_notification_job()")).rows
        .length,
      0,
    );
  } finally {
    await db.exec("rollback");
  }
});
test("notification tables and service RPCs deny anonymous and student clients", async () => {
  for (const role of ["anon", "authenticated"] as const) {
    for (const table of [
      "notification_outbox",
      "notification_rate_limits",
      "notification_unsubscribe_tokens",
    ])
      await asUser(role, alice, async () => {
        await assert.rejects(
          db.query(`select * from public.${table}`),
          /permission denied/,
        );
      });
    for (const query of [
      "select public.confirm_launch_notification('invalid')",
      "select * from public.claim_notification_job()",
      "select * from public.launch_notification_candidates()",
    ])
      await asUser(role, alice, async () => {
        await assert.rejects(db.query(query), /permission denied/);
      });
  }
});
async function asUser(
  role: "anon" | "authenticated",
  id: string,
  fn: () => Promise<void>,
) {
  await db.exec("begin");
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [
      id,
    ]);
    await db.exec(`set local role ${role}`);
    await fn();
  } finally {
    await db.exec("rollback");
  }
}
test("migrations backfill accounts and bootstrap new users as students only", async () => {
  const profiles = await db.query<{
    display_name: string;
    preferred_language: string;
  }>(
    "select display_name, preferred_language from public.profiles order by display_name",
  );
  assert.deepEqual(profiles.rows, [
    { display_name: "Alice", preferred_language: "en" },
    { display_name: "Bob", preferred_language: "hi" },
  ]);
  assert.deepEqual(
    (await db.query("select distinct role from public.user_roles")).rows,
    [{ role: "student" }],
  );
});
test("anonymous access sees only public catalogue and cannot read private profiles", async () => {
  await asUser("anon", "", async () => {
    assert.equal(
      (await db.query("select * from public.courses")).rows.length,
      9,
    );
    await assert.rejects(
      db.query("select * from public.profiles"),
      /permission denied/,
    );
  });
});
test("students read only their own profile and cannot update another student's name", async () => {
  await asUser("authenticated", alice, async () => {
    assert.deepEqual(
      (await db.query("select display_name from public.profiles")).rows,
      [{ display_name: "Alice" }],
    );
    const other = await db.query(
      "update public.profiles set display_name='Stolen' where id=$1 returning id",
      [bob],
    );
    assert.equal(other.rows.length, 0);
    const own = await db.query(
      "update public.profiles set display_name='Alice changed' where id=$1 returning display_name",
      [alice],
    );
    assert.deepEqual(own.rows, [{ display_name: "Alice changed" }]);
  });
});
test("profile identity and role grants cannot be changed by a student", async () => {
  await asUser("authenticated", alice, async () => {
    await assert.rejects(
      db.query("update public.profiles set id=$1 where id=$2", [bob, alice]),
      /permission denied/,
    );
  });
  await asUser("authenticated", alice, async () => {
    await assert.rejects(
      db.query(
        "insert into public.user_roles(user_id,role) values ($1,'admin')",
        [alice],
      ),
      /permission denied/,
    );
  });
});
test("deletion requests are owned, initially requested, and repeat-safe", async () => {
  await asUser("authenticated", alice, async () => {
    await db.query(
      "insert into public.account_deletion_requests(user_id) values ($1)",
      [alice],
    );
    assert.deepEqual(
      (
        await db.query(
          "select user_id,status from public.account_deletion_requests",
        )
      ).rows,
      [{ user_id: alice, status: "requested" }],
    );
    await assert.rejects(
      db.query(
        "insert into public.account_deletion_requests(user_id) values ($1)",
        [alice],
      ),
      /duplicate key/,
    );
  });
  await asUser("authenticated", alice, async () => {
    await assert.rejects(
      db.query(
        "insert into public.account_deletion_requests(user_id) values ($1)",
        [bob],
      ),
      /row-level security/,
    );
  });
  await asUser("authenticated", alice, async () => {
    await assert.rejects(
      db.query(
        "insert into public.account_deletion_requests(user_id,status) values ($1,'completed')",
        [alice],
      ),
      /permission denied/,
    );
  });
});
test("preferences are private and optional reminders default off", async () => {
  await asUser("authenticated", alice, async () => {
    assert.deepEqual(
      (
        await db.query(
          "select optional_exam_reminders from public.notification_preferences",
        )
      ).rows,
      [{ optional_exam_reminders: false }],
    );
    assert.equal(
      (
        await db.query(
          "update public.notification_preferences set optional_exam_reminders=true where user_id=$1 returning user_id",
          [bob],
        )
      ).rows.length,
      0,
    );
  });
});
test("deletion request RPC is repeat-safe and cannot target another user", async () => {
  await asUser("authenticated", alice, async () => {
    const first = await db.query(
      "select public.request_account_deletion() as id",
    );
    const second = await db.query(
      "select public.request_account_deletion() as id",
    );
    assert.deepEqual(first.rows, second.rows);
    assert.deepEqual(
      (await db.query("select user_id from public.account_deletion_requests"))
        .rows,
      [{ user_id: alice }],
    );
  });
  await asUser("anon", "", async () => {
    await assert.rejects(
      db.query("select public.request_account_deletion()"),
      /permission denied/,
    );
  });
});
test("private launch subscriptions are inaccessible to anonymous and student clients", async () => {
  for (const role of ["anon", "authenticated"] as const)
    await asUser(role, alice, async () => {
      await assert.rejects(
        db.query("select * from public.course_interest_subscriptions"),
        /permission denied/,
      );
    });
});
test("audit records cannot be forged and students cannot read them", async () => {
  await asUser("authenticated", alice, async () => {
    assert.equal(
      (await db.query("select * from public.audit_logs")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.audit_logs(action,resource) values ('FAKE','roles')",
      ),
      /permission denied/,
    );
  });
});
test("only an operator-assigned admin can read staff records", async () => {
  await db.query(
    "insert into public.user_roles(user_id,role) values ($1,'admin')",
    [alice],
  );
  await asUser("authenticated", alice, async () => {
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      2,
    );
    assert.ok(
      (await db.query("select * from public.audit_logs")).rows.length > 0,
    );
  });
  await db.query(
    "delete from public.user_roles where user_id=$1 and role='admin'",
    [alice],
  );
});
