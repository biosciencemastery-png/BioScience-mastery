import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { confirmationSchema } from "./validation";
import type { Locale } from "../i18n";

const codeSchema = z.string().regex(/^[A-Za-z0-9_-]{20,512}$/);
export function parseEmailCallback(input: Record<string, unknown>) {
  // Reject provider errors and ambiguous callbacks, including duplicate query values.
  if ("error" in input || "error_code" in input || "error_description" in input)
    return null;
  if ("code" in input) {
    if ("token_hash" in input || "type" in input) return null;
    const code = codeSchema.safeParse(input.code);
    return code.success ? { kind: "pkce" as const, code: code.data } : null;
  }
  const token = confirmationSchema.safeParse(input);
  return token.success ? { kind: "token" as const, ...token.data } : null;
}
export type EmailCallback = NonNullable<ReturnType<typeof parseEmailCallback>>;

export async function completeEmailCallback(
  client: Pick<SupabaseClient, "auth">,
  input: EmailCallback,
  locale: Locale,
): Promise<string | null> {
  try {
    if (input.kind === "pkce") {
      const { data, error } = await client.auth.exchangeCodeForSession(
        input.code,
      );
      if (error || !data.session || !data.user?.email_confirmed_at) return null;
      // Supabase recovers this from the initiating browser's PKCE verifier storage.
      // Never take the recovery destination from query parameters or a next URL.
      return "redirectType" in data && data.redirectType === "recovery"
        ? `/${locale}/reset-password`
        : `/${locale}/account?notice=verified`;
    }
    const { data, error } = await client.auth.verifyOtp({
      token_hash: input.token_hash,
      type: input.type,
    });
    if (error || !data.session || !data.user?.email_confirmed_at) return null;
    return input.type === "recovery"
      ? `/${locale}/reset-password`
      : `/${locale}/account?notice=verified`;
  } catch {
    return null;
  }
}
