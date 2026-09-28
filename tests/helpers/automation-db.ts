import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
export const identities = {
  admin: "00000000-0000-4000-8000-000000000051",
  editor: "00000000-0000-4000-8000-000000000052",
  student: "00000000-0000-4000-8000-000000000053",
};
export async function automationDatabase() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to anon,authenticated;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb);`);
  for (const id of Object.values(identities))
    await db.query("insert into auth.users(id) values($1)", [id]);
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  await db.query(
    "insert into public.user_roles(user_id,role) values($1,'admin'),($2,'editor') on conflict do nothing",
    [identities.admin, identities.editor],
  );
  return db;
}
