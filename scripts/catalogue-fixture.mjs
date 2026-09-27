// Local-only browser-test fixture. Executes the real migrations and anonymous RLS.
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; grant usage on schema auth to anon,authenticated;
 create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb);`);
for (const name of (await readdir("supabase/migrations"))
  .filter((n) => n.endsWith(".sql"))
  .sort())
  await db.exec(await readFile(`supabase/migrations/${name}`, "utf8"));
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/health") {
    res.end("{}");
    return;
  }
  if (req.method !== "GET" || !req.url?.startsWith("/rest/v1/examinations?")) {
    res.writeHead(400);
    res.end('{"message":"Local fixture does not provide authentication"}');
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      await tx.exec("set local role anon");
      return tx.query(
        `select e.id,e.slug,e.name,e.name_hi,coalesce((select json_agg(json_build_object('id',c.id,'slug',c.slug,'launch_status',c.launch_status)) from public.courses c where c.examination_id=e.id),'[]'::json) courses from public.examinations e order by e.display_order`,
      );
    });
    res.end(JSON.stringify(result.rows));
  } catch {
    res.writeHead(500);
    res.end("{}");
  }
});
server.listen(54321, "127.0.0.1");
