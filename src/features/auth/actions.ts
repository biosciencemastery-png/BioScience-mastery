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
  completeEmailCallback,
  parseEmailCallback,
} from "@/lib/auth/email-callback";
import {
  localeSchema,
  credentialsSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  confirmationSchema,
  type AuthState,
} from "@/lib/auth/validation";

import {
  wizardSchema,
  studentInput,
  studentProfileSchema,
} from "./student-validation";
import { registrationPolicies } from "@/features/legal/server";
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
  const input = wizardSchema.safeParse({
    ...Object.fromEntries(form),
    ...studentInput(form),
  });
  if (!input.success) return state("error", "invalid");
  const config = authConfig();
  if (!config) return state("error", "setup");
  const policies = await registrationPolicies(input.data.locale);
  if (
    !policies ||
    policies.terms !== input.data.terms_version ||
    policies.privacy !== input.data.privacy_version
  )
    return state("error", "setup");
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
          student_registration: {
            details: input.data.details,
            ...input.data.goals,
            terms: true,
            privacy: true,
            terms_version: policies.terms,
            privacy_version: policies.privacy,
          },
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
  const input = parseEmailCallback({ code: form.get("code") });
  if (!locale.success || !input) {
    return state("error", "link");
  }

  if (!authConfig()) {
    return state("error", "setup");
  }

  let destination: string | null;
  try {
    const supabase = await supabaseServer();
    destination = await completeEmailCallback(supabase, input, locale.data);
  } catch {
    return state("error", "failed");
  }

  if (!destination) return state("error", "link");
  redirect(destination);
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
    const { data: requestId, error } = await supabase.rpc(
      "request_account_deletion",
    );
    if (error || !requestId) return state("error", "failed");
    revalidatePath(`/${locale.data}/account`);
    return state("success", "deletionRequested");
  } catch {
    return state("error", "failed");
  }
}

export async function saveStudentProfileAction(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const input = studentProfileSchema.safeParse({
    locale: form.get("locale"),
    ...studentInput(form),
  });
  if (!input.success) return state("error", "invalid");
  const { supabase } = await requireUser(input.data.locale);
  try {
    const { error } = await supabase.rpc("save_student_details", {
      p_details: input.data.details,
      p_exams: input.data.goals.exam_ids,
      p_year: input.data.goals.target_year,
      p_marketing: input.data.goals.marketing,
    });
    if (error) return state("error", "failed");
    revalidatePath(`/${input.data.locale}/account`);
    return state("success", "profileSaved");
  } catch {
    return state("error", "failed");
  }
}
export async function setActiveExamAction(form: FormData) {
  const locale = localeOf(form);
  const examinationId = form.get("examination_id");

  if (
    !locale.success ||
    typeof examinationId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(examinationId)
  ) {
    redirect("/en/account?notice=failed");
  }

  const { supabase } = await requireUser(locale.data);

  const { error } = await supabase.rpc("set_active_student_exam", {
    p_examination_id: examinationId,
  });

  if (error) {
    redirect(`/${locale.data}/account?notice=failed`);
  }

  revalidatePath(`/${locale.data}/account`);
  redirect(`/${locale.data}/account`);
}