import "server-only";
import { redirect, notFound } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { supabaseServer } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export async function requireUser(locale: Locale) {
  if (!authConfig()) redirect(`/${locale}/login?notice=setup`);
  const supabase = await supabaseServer();
  // A live Auth lookup checks account/session validity; never authorize from getSession().
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at) redirect(`/${locale}/login`);
  return { supabase, user };
}

export async function requireAdmin(locale: Locale) {
  const result = await requireUser(locale);
  const { data, error } = await result.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", result.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) notFound();
  return result;
}
