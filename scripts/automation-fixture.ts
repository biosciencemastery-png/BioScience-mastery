// Isolated loopback-only browser fixture. Never imported by the application.
// Supabase Auth is simulated; SQL/RLS/mutation functions are the real migrations.
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { automationDatabase, identities } from "../tests/helpers/automation-db";

async function main() {
  const db = await automationDatabase();
  await db.exec(
    "insert into private.automation_allowed_origins values('https://official.example.org','Synthetic browser fixture only; not an approved real examination source'); update private.automation_config set manual_collection_enabled=true",
  );
  const tokens = new Map<string, keyof typeof identities>();
  const user = (role: keyof typeof identities) => ({
    id: identities[role],
    email: `${role}@example.test`,
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    app_metadata: { provider: "email" },
    user_metadata: {},
  });
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const url = new URL(req.url ?? "/", "http://127.0.0.1:54321");
    if (url.pathname === "/health") {
      res.end("{}");
      return;
    }
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 50000) {
        res.writeHead(413);
        res.end("{}");
        return;
      }
    }
    try {
      const input = raw ? JSON.parse(raw) : {};
      if (url.pathname === "/auth/v1/token" && req.method === "POST") {
        const role = input.email?.split("@")[0] as keyof typeof identities;
        if (
          !Object.hasOwn(identities, role) ||
          input.email !== `${role}@example.test` ||
          input.password !== "fixture-password-only"
        ) {
          res.writeHead(400);
          res.end('{"message":"Invalid fixture credentials"}');
          return;
        }
        const header = Buffer.from(
          JSON.stringify({ alg: "HS256", typ: "JWT" }),
        ).toString("base64url");
        const body = Buffer.from(
          JSON.stringify({
            sub: identities[role],
            aud: "authenticated",
            role: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
          }),
        ).toString("base64url");
        const token = `${header}.${body}.${createHmac("sha256", "local-synthetic-fixture-only").update(`${header}.${body}`).digest("base64url")}`;
        tokens.set(token, role);
        res.end(
          JSON.stringify({
            access_token: token,
            refresh_token: `fixture-${role}`,
            expires_in: 3600,
            token_type: "bearer",
            user: user(role),
          }),
        );
        return;
      }
      const role = tokens.get(
        (req.headers.authorization ?? "").replace(/^Bearer /, ""),
      );
      if (url.pathname === "/auth/v1/user") {
        if (!role) {
          res.writeHead(401);
          res.end('{"message":"Invalid fixture session"}');
          return;
        }
        res.end(JSON.stringify(user(role)));
        return;
      }
      if (
        url.pathname.startsWith("/rest/v1/rpc/") &&
        req.method === "POST" &&
        role
      ) {
        const name = url.pathname.split("/").at(-1);
        if (
          !["automation_dashboard", "automation_command"].includes(name ?? "")
        ) {
          res.writeHead(404);
          res.end("{}");
          return;
        }
        const result = await db.transaction(async (tx) => {
          await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
            identities[role],
          ]);
          await tx.exec("set local role authenticated");
          return name === "automation_dashboard"
            ? tx.query("select public.automation_dashboard() result")
            : tx.query("select public.automation_command($1,$2) result", [
                input.command,
                input.payload,
              ]);
        });
        res.end(JSON.stringify((result.rows[0] as { result: unknown }).result));
        return;
      }
      if (url.pathname === "/rest/v1/examinations") {
        const result = await db.transaction(async (tx) => {
          await tx.exec("set local role anon");
          return tx.query(
            "select e.id,e.slug,e.name,e.name_hi,coalesce((select json_agg(json_build_object('id',c.id,'slug',c.slug,'launch_status',c.launch_status)) from public.courses c where c.examination_id=e.id),'[]'::json) courses from public.examinations e order by e.display_order",
          );
        });
        res.end(JSON.stringify(result.rows));
        return;
      }
      res.writeHead(404);
      res.end('{"message":"Unsupported local fixture route"}');
    } catch (error) {
      const e = error as { code?: string; message?: string };
      res.writeHead(e.code === "42501" ? 403 : 400);
      res.end(JSON.stringify({ code: e.code, message: e.message }));
    }
  });
  server.listen(54321, "127.0.0.1");
}
void main();
