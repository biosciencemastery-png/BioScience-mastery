"use server";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/lib/i18n";
import { commandSchema, manualCollectionAllowed } from "./model";
import { automationStaff } from "./server";

export type AutomationState = {
  status: "idle" | "success" | "error";
  message: "" | "saved" | "invalid" | "blocked" | "failed";
};
export async function automationAction(
  _: AutomationState,
  form: FormData,
): Promise<AutomationState> {
  const locale = form.get("locale");
  if (typeof locale !== "string" || !isLocale(locale))
    return { status: "error", message: "invalid" };
  const input = commandSchema.safeParse({
    ...Object.fromEntries(form),
    active: form.get("active") === "on",
    rights_confirmed: form.get("rights_confirmed") === "on",
  });
  if (!input.success) return { status: "error", message: "invalid" };
  const { supabase, dashboard } = await automationStaff(locale);
  if (!dashboard) return { status: "error", message: "blocked" };
  const { command, ...payload } = input.data;
  if (
    (command === "source" ||
      command === "collect" ||
      command === "approve" ||
      command === "reject") &&
    !dashboard.is_admin
  )
    return { status: "error", message: "blocked" };
  try {
    if (input.data.command === "collect") {
      if (!manualCollectionAllowed() || !dashboard.collection_enabled)
        return { status: "error", message: "blocked" };
      const p = input.data;
      const { data: job, error } = await supabase.rpc("automation_command", {
        command: "claim",
        payload: { source_id: p.source_id, idempotency_key: p.idempotency_key },
      });
      if (error || !job) return { status: "error", message: "failed" };
      if (!job.finished) {
        const completed = await supabase.rpc("automation_command", {
          command: p.outcome,
          payload: {
            job_id: job.id,
            lease_token: job.lease_token,
            text: p.text,
            language: p.language,
          },
        });
        if (completed.error) return { status: "error", message: "failed" };
      }
    } else {
      const { error } = await supabase.rpc("automation_command", {
        command,
        payload,
      });
      if (error) return { status: "error", message: "failed" };
    }
  } catch {
    return { status: "error", message: "failed" };
  }
  revalidatePath(`/${locale}/admin/automation`);
  return { status: "success", message: "saved" };
}
