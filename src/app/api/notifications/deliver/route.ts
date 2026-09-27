import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  notificationConfig,
  notificationDatabase,
} from "@/features/notifications/server";
import {
  matchesSecret,
  newToken,
  tokenHash,
  seal,
  unseal,
} from "@/features/notifications/security";
import {
  notificationEmail,
  emailPayload,
  sendNotification,
} from "@/features/notifications/email";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const candidate = z.object({
  id: z.string().uuid(),
  email_normalized: z.string().email(),
  locale: z.enum(["en", "hi"]),
  title: z.string(),
  slug: z.string(),
});
export async function POST(request: NextRequest) {
  const config = notificationConfig(),
    secret = process.env.NOTIFICATION_WORKER_SECRET;
  if (
    !config ||
    process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
    !secret ||
    secret.length < 32
  )
    return NextResponse.json({ error: "Delivery disabled" }, { status: 503 });
  if (
    !matchesSecret(
      request.headers.get("authorization") ?? "",
      `Bearer ${secret}`,
    )
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = notificationDatabase(config);
  let sent = 0,
    failed = 0;
  const { data: candidates, error } = await db.rpc(
    "launch_notification_candidates",
  );
  if (error)
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  for (const row of candidates ?? []) {
    const parsed = candidate.safeParse(row);
    if (!parsed.success) continue;
    const s = parsed.data,
      token = newToken();
    const unsubscribe = `${config.origin}/${s.locale}/notifications/unsubscribe?token=${token}`;
    const payload = notificationEmail({
      locale: s.locale,
      to: s.email_normalized,
      course: s.title,
      unsubscribe,
      information: `${config.origin}/${s.locale}/exams`,
    });
    const { error: queueError } = await db.rpc("queue_course_launch", {
      p_subscription: s.id,
      p_unsubscribe_hash: tokenHash(token),
      p_payload: seal(payload, config.encryption),
    });
    if (queueError)
      return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }
  for (let i = 0; i < 10; i++) {
    const { data: jobs, error: claimError } = await db.rpc(
      "claim_notification_job",
    );
    if (claimError)
      return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
    const job = jobs?.[0];
    if (!job) break;
    const { data: current } = await db
      .from("notification_outbox")
      .select("status,lease_id")
      .eq("id", job.id)
      .single();
    if (current?.status !== "processing" || current.lease_id !== job.lease_id)
      continue;
    let success = false;
    try {
      const payload = emailPayload.parse(
        unseal(job.encrypted_payload, config.encryption),
      );
      await sendNotification(payload, {
        enabled: process.env.EMAIL_DELIVERY_ENABLED === "true",
        apiKey: config.apiKey,
        from: config.from,
        jobId: job.id,
      });
      success = true;
      sent++;
    } catch {
      failed++;
    }
    const { error: finishError } = await db.rpc("finish_notification_job", {
      p_job: job.id,
      p_lease: job.lease_id,
      p_success: success,
    });
    if (finishError)
      return NextResponse.json(
        { error: "Queue update failed" },
        { status: 503 },
      );
  }
  return NextResponse.json(
    { sent, failed },
    { headers: { "Cache-Control": "no-store" } },
  );
}
