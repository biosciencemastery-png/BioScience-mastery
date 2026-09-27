import "server-only";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "@/lib/auth/config";

export function publicDatabase() {
  if (process.env.CATALOGUE_ENABLED !== "true") return null;
  // Public catalogue reads are independent of the sign-in feature flag and subject to RLS.
  const config = authConfig({ ...process.env, AUTH_ENABLED: "true" });
  return config
    ? createClient(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (url, init) =>
            fetch(url, {
              ...init,
              cache: "no-store",
              signal: AbortSignal.timeout(5000),
            }),
        },
      })
    : null;
}
