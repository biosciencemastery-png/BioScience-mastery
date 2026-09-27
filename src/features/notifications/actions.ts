"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { emailSchema, localeSchema } from "@/lib/auth/validation";
import {
  notificationConfig,
  notificationDatabase,
  verifyChallenge,
} from "./server";
import { newToken, tokenHash, rateHash, seal } from "./security";
import { notificationEmail } from "./email";
export type NotificationState = {
  status: "idle" | "success" | "error";
  message:
    | "success"
    | "invalid"
    | "disabled"
    | "confirmed"
    | "unsubscribed"
    | "badLink"
    | "";
};
const schema = z.object({
  email: emailSchema,
  locale: localeSchema,
  course_id: z.string().uuid(),
  consent: z.literal("on"),
  "cf-turnstile-response": z.string().min(1).max(2048),
  website: z.literal(""),
});
export async function subscribeAction(
  _: NotificationState,
  form: FormData,
): Promise<NotificationState> {
  const config = notificationConfig();
  if (!config || process.env.EMAIL_DELIVERY_ENABLED !== "true")
    return { status: "error", message: "disabled" };
  const input = schema.safeParse(Object.fromEntries(form));
  if (!input.success) return { status: "error", message: "invalid" };
  if (!(await verifyChallenge(input.data["cf-turnstile-response"], config)))
    return { status: "error", message: "invalid" };
  const db = notificationDatabase(config);
  try {
    const { data: course, error } = await db
      .from("courses")
      .select(
        "id,slug,title,launch_status,is_public,examinations!inner(is_public)",
      )
      .eq("id", input.data.course_id)
      .eq("is_public", true)
      .in("launch_status", ["coming_soon", "in_preparation"])
      .maybeSingle();
    if (error) throw error;
    if (course) {
      const confirm = newToken(),
        unsubscribe = newToken(),
        locale = input.data.locale;
      const base = `${config.origin}/${locale}/notifications`;
      const payload = notificationEmail({
        locale,
        to: input.data.email,
        course: course.title,
        confirm: `${base}/confirm?token=${confirm}`,
        unsubscribe: `${base}/unsubscribe?token=${unsubscribe}`,
        information: `${config.origin}/${locale}/exams`,
      });
      const requestHeaders = await headers();
      // On Vercel use its overwritten trusted header. Else share a conservative fallback bucket.
      const source = process.env.VERCEL
        ? (requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0] ??
          "unknown")
        : "local";
      const { error: saveError } = await db.rpc("request_launch_notification", {
        p_course: course.id,
        p_email: input.data.email,
        p_locale: locale,
        p_confirm_hash: tokenHash(confirm),
        p_unsubscribe_hash: tokenHash(unsubscribe),
        p_payload: seal(payload, config.encryption),
        p_email_bucket: rateHash(input.data.email, config.encryption),
        p_source_bucket: rateHash(source, config.encryption),
      });
      if (saveError) throw saveError;
    }
    return { status: "success", message: "success" };
  } catch {
    return { status: "error", message: "invalid" };
  }
}
export async function notificationLinkAction(
  _: NotificationState,
  form: FormData,
): Promise<NotificationState> {
  const config = notificationConfig();
  if (!config) return { status: "error", message: "disabled" };
  const input = z
    .object({
      token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
      kind: z.enum(["confirm", "unsubscribe"]),
      locale: localeSchema,
    })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { status: "error", message: "badLink" };
  try {
    const { data, error } = await notificationDatabase(config).rpc(
      input.data.kind === "confirm"
        ? "confirm_launch_notification"
        : "unsubscribe_launch_notification",
      { p_hash: tokenHash(input.data.token) },
    );
    return error || !data
      ? { status: "error", message: "badLink" }
      : {
          status: "success",
          message: input.data.kind === "confirm" ? "confirmed" : "unsubscribed",
        };
  } catch {
    return { status: "error", message: "badLink" };
  }
}
