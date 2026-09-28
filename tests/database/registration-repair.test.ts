import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { automationDatabase } from "../helpers/automation-db";

test("repair restores tampered triggers; published EN/HI consent permits student-only signup", async () => {
  const db = await automationDatabase();
  try {
    const existingRoles = (
      await db.query<{ user_id: string; role: string }>(
        "select * from public.user_roles order by user_id,role",
      )
    ).rows;
    // Reproduce the reported manual troubleshooting drift without touching a hosted DB.
    await db.exec(`create or replace function private.handle_new_user() returns trigger language plpgsql as $$begin raise exception 'tampered bootstrap'; end;$$;
      create or replace function private.capture_student_registration() returns trigger language plpgsql as $$begin return new; end;$$;`);
    await db.exec(
      await readFile(
        "supabase/migrations/202609300002_restore_secure_registration.sql",
        "utf8",
      ),
    );
    await assert.rejects(
      db.query("insert into auth.users(id) values($1)", [randomUUID()]),
      /Registration is not open/,
    );
    const activation = await readFile(
      "supabase/setup/publish_registration_policies.sql",
      "utf8",
    );
    await db.exec(activation);
    await db.exec("set role anon");
    const policies = (
      await db.query<{ id: string; kind: string; locale: string }>(
        "select id,kind,locale from public.legal_policy_versions where is_current and status='published' and effective_at<=now()",
      )
    ).rows;
    assert.equal(policies.length, 4);
    await db.exec("reset role");
    const invalidId = randomUUID();
    await assert.rejects(
      db.query("insert into auth.users(id) values($1)", [invalidId]),
      /consent or profile missing/,
    );
    assert.equal(
      (await db.query("select * from public.profiles where id=$1", [invalidId]))
        .rows.length,
      0,
    );
    for (const locale of ["en", "hi"]) {
      const uid = randomUUID();
      await db.query(
        "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
        [
          uid,
          {
            display_name: "Public learner",
            locale,
            role: "admin",
            roles: ["admin", "editor"],
            student_registration: {
              terms: true,
              privacy: true,
              details: {},
              exam_ids: [],
              target_year: null,
              marketing: false,
              terms_version: policies.find(
                (p) => p.locale === locale && p.kind === "terms",
              )!.id,
              privacy_version: policies.find(
                (p) => p.locale === locale && p.kind === "privacy",
              )!.id,
            },
          },
        ],
      );
      assert.deepEqual(
        (
          await db.query(
            "select role from public.user_roles where user_id=$1",
            [uid],
          )
        ).rows,
        [{ role: "student" }],
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
      assert.equal(
        (
          await db.query(
            "select * from public.student_academic_profiles where user_id=$1",
            [uid],
          )
        ).rows.length,
        1,
      );
      assert.deepEqual(
        (
          await db.query(
            "select optional_exam_reminders,marketing_consent from public.notification_preferences where user_id=$1",
            [uid],
          )
        ).rows,
        [{ optional_exam_reminders: false, marketing_consent: false }],
      );
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        uid,
      ]);
      await db.exec("set role authenticated");
      await assert.rejects(
        db.query(
          "insert into public.user_roles(user_id,role) values(auth.uid(),'admin')",
        ),
        /permission denied/,
      );
      await db.exec("reset role");
    }
    for (const previous of existingRoles)
      assert.ok(
        (
          await db.query(
            "select 1 from public.user_roles where user_id=$1 and role=$2",
            [previous.user_id, previous.role],
          )
        ).rows.length,
      );
    await assert.rejects(db.exec(activation), /Policies already exist/);
    await db.exec("rollback");
    assert.equal(
      (await db.query("select * from public.legal_policy_versions")).rows
        .length,
      4,
    );
  } finally {
    await db.close();
  }
});
