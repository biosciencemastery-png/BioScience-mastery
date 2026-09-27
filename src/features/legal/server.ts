import "server-only";
import { publicDatabase } from "@/lib/supabase/public";
import { authConfig } from "@/lib/auth/config";
import { supabaseServer } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import { draftPolicy, type PolicyKind } from "./content";
export async function registrationPolicies(locale: Locale) {
  if (!authConfig() || process.env.REGISTRATION_ENABLED !== "true") return null;
  try {
    const db = await supabaseServer();
    const { data, error } = await db
      .from("legal_policy_versions")
      .select("id,kind,version")
      .eq("locale", locale)
      .eq("status", "published")
      .eq("is_current", true)
      .lte("effective_at", new Date().toISOString())
      .in("kind", ["terms", "privacy"]);
    const terms = data?.find((p) => p.kind === "terms"),
      privacy = data?.find((p) => p.kind === "privacy");
    return error || !terms || !privacy
      ? null
      : { terms: terms.id as string, privacy: privacy.id as string };
  } catch {
    return null;
  }
}
export async function readPolicy(locale: Locale, kind: PolicyKind) {
  const draft = draftPolicy(locale, kind),
    db = publicDatabase();
  if (!db) return draft;
  try {
    const { data, error } = await db
      .from("legal_policy_versions")
      .select("body,version,effective_at,status")
      .eq("locale", locale)
      .eq("kind", kind)
      .eq("is_current", true)
      .eq("status", "published")
      .lte("effective_at", new Date().toISOString())
      .maybeSingle();
    return !error && data ? { ...draft, ...data } : draft;
  } catch {
    return draft;
  }
}
