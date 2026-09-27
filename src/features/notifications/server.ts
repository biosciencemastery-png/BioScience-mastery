import "server-only";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "@/lib/auth/config";
export function notificationConfig() {
  const env = process.env;
  if (env.NOTIFICATIONS_ENABLED !== "true") return null;
  const publicConfig = authConfig({ ...env, AUTH_ENABLED: "true" });
  const key = env.SUPABASE_SECRET_KEY,
    encryption = env.NOTIFICATION_ENCRYPTION_KEY,
    apiKey = env.RESEND_API_KEY,
    from = env.NOTIFICATION_FROM_EMAIL,
    turnstile = env.TURNSTILE_SECRET_KEY,
    siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (
    !publicConfig ||
    !key?.startsWith("sb_secret_") ||
    !encryption?.match(/^[a-f0-9]{64}$/i) ||
    !apiKey?.startsWith("re_") ||
    !from ||
    !turnstile ||
    !siteKey
  )
    return null;
  return { ...publicConfig, key, encryption, apiKey, from, turnstile, siteKey };
}
export function notificationDatabase(
  config: NonNullable<ReturnType<typeof notificationConfig>>,
) {
  return createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
export async function verifyChallenge(
  token: string,
  config: NonNullable<ReturnType<typeof notificationConfig>>,
) {
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: config.turnstile,
          response: token,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const data = await response.json();
    return (
      response.ok &&
      data.success === true &&
      data.hostname === new URL(config.origin).hostname &&
      data.action === "launch-notification"
    );
  } catch {
    return false;
  }
}
