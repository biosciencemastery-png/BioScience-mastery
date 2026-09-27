"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  authConfig,
  confirmationUrl,
  recoveryConfirmationUrl,
} from "@/lib/auth/config";

import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import {
  localeSchema,
  credentialsSchema,
  registrationSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  confirmationSchema,
  type AuthState,
} from "@/lib/auth/validation";

function state(status: "error" | "success", message: string): AuthState {
  return { status, message };
}
function localeOf(form: FormData) {
  return localeSchema.safeParse(form.get("locale"));
}

export async function loginAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form),
    input = credentialsSchema.safeParse(Object.fromEntries(form));
  if (!locale.success || !input.success) return state("error", "invalid");
  if (!authConfig()) return state("error", "setup");
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword(input.data);
    if (error) return state("error", "credentials");
  } catch {
    return state("error", "failed");
  }
  redirect(`/${locale.data}/account`);
}

export async function registerAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = registrationSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return state("error", "invalid");
  const config = authConfig();
  if (!config) return state("error", "setup");
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email: input.data.email,
      password: input.data.password,
      options: {
        emailRedirectTo: confirmationUrl(config.origin, input.data.locale),
        data: {
          display_name: input.data.display_name,
          locale: input.data.locale,
        },
      },
    });
    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return state("error", "confirmation");
    }
    // Duplicate-account outcomes use the same response, not account-existence clues.
    if (
      error &&
      !["user_already_exists", "email_exists"].includes(error.code ?? "")
    )
      return state("error", "failed");
    return state("success", "registered");
  } catch {
    return state("error", "failed");
  }
}

export async function forgotAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form),
    email = emailSchema.safeParse(form.get("email"));
  if (!locale.success || !email.success) return state("error", "invalid");
  const config = authConfig();
  if (!config) return state("error", "setup");
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: recoveryConfirmationUrl(config.origin, locale.data),
    });
    if (error) return state("error", "failed");
    return state("success", "resetSent");
  } catch {
    return state("error", "failed");
  }
}

export async function pkceConfirmAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form);
  const code = form.get("code");
  const flow = form.get("flow");

  if (
    !locale.success ||
    typeof code !== "string" ||
    !/^[A-Za-z0-9_-]{8,2048}$/.test(code) ||
    (flow !== "recovery" && flow !== "signup")
  ) {
    return state("error", "link");
  }

  if (!authConfig()) {
    return state("error", "setup");
  }

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return state("error", "link");
    }
  } catch {
    return state("error", "failed");
  }

  redirect(
    flow === "recovery"
      ? `/${locale.data}/reset-password`
      : `/${locale.data}/account?notice=verified`,
  );
}

export async function confirmAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form),
    input = confirmationSchema.safeParse(Object.fromEntries(form));
  if (!locale.success || !input.success) return state("error", "link");
  if (!authConfig()) return state("error", "setup");
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp(input.data);
    if (error) return state("error", "link");
  } catch {
    return state("error", "failed");
  }
  // No user-supplied next URL is ever honored.
  redirect(
    input.data.type === "recovery"
      ? `/${locale.data}/reset-password`
      : `/${locale.data}/account?notice=verified`,
  );
}

export async function resetAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form),
    password = passwordSchema.safeParse(form.get("password"));
  if (!locale.success || !password.success) return state("error", "invalid");
  const { supabase } = await requireUser(locale.data);
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.data,
    });
    if (error) return state("error", "failed");
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "global",
    });
    if (signOutError) return state("error", "failed");
  } catch {
    return state("error", "failed");
  }
  redirect(`/${locale.data}/login?notice=passwordUpdated`);
}

export async function logoutAction(form: FormData) {
  const locale = localeOf(form);
  if (!locale.success || !authConfig()) redirect("/en");
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect(`/${locale.data}/account?notice=failed`);
  redirect(`/${locale.data}/login`);
}

export async function profileAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form),
    language = localeSchema.safeParse(form.get("preferred_language")),
    name = nameSchema.safeParse(form.get("display_name"));
  if (!locale.success || !language.success || !name.success)
    return state("error", "invalid");
  const { supabase, user } = await requireUser(locale.data);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: name.data, preferred_language: language.data })
      .eq("id", user.id)
      .select("id")
      .single();
    if (error || !data) return state("error", "failed");
    revalidatePath(`/${locale.data}/account`);
    return state("success", "profileSaved");
  } catch {
    return state("error", "failed");
  }
}

export async function deletionAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const locale = localeOf(form),
    password = form.get("password");
  if (
    !locale.success ||
    typeof password !== "string" ||
    password.length > 128 ||
    !password ||
    form.get("acknowledge") !== "on"
  )
    return state("error", "invalid");
  const { supabase, user } = await requireUser(locale.data);
  if (!user.email) return state("error", "failed");
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (authError || data.user?.id !== user.id)
      return state("error", "password");
    const { error } = await supabase
      .from("account_deletion_requests")
      .insert({ user_id: user.id });
    if (error && error.code !== "23505") return state("error", "failed");
    revalidatePath(`/${locale.data}/account`);
    return state("success", "deletionRequested");
  } catch {
    return state("error", "failed");
  }
}
