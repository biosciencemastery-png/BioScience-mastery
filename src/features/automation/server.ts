import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import type { Locale } from "@/lib/i18n";
import type { Dashboard } from "./model";

export async function automationStaff(locale: Locale) {
  const session = await requireUser(locale);
  // The database RPC independently checks current roles; no claims/metadata trust.
  const { data, error } = await session.supabase.rpc("automation_dashboard");
  if (error?.code === "42501") notFound();
  if (error || !data) return { ...session, dashboard: null };
  return { ...session, dashboard: data as Dashboard };
}
