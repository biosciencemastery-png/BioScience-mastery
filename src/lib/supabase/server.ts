import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth/config";

export async function supabaseServer() {
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured.");
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    // All auth operations are server-side; no browser Supabase client reads these cookies.
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.origin.startsWith("https:"),
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies; proxy refreshes them. */
        }
      },
    },
  });
}
