import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
before(async () => {
  // Reproduce Supabase's auth boundary in an isolated PostgreSQL engine; no hosted writes.
  await db.exec(`create role anon; create role authenticated;
    create schema auth; grant usage on schema auth to anon, authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
    insert into auth.users values ('${alice}', '{"display_name":"Alice","role":"admin"}');`);
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  await db.query(
    "insert into auth.users(id,raw_user_meta_data) values ($1,$2)",
    [bob, { display_name: "Bob", locale: "hi", role: "admin" }],
  );
});
after(async () => {
  await db.close();
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
      6,
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
