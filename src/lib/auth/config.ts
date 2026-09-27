export function authConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.AUTH_ENABLED !== "true") return null;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const site = env.SITE_URL;
  if (!url || !key?.startsWith("sb_publishable_") || !site) return null;
  try {
    const project = new URL(url);
    const origin = new URL(site);
    for (const value of [project, origin]) {
      const local = ["localhost", "127.0.0.1"].includes(value.hostname);
      if (value.protocol !== "https:" && !(local && value.protocol === "http:"))
        return null;
      if (
        value.username ||
        value.password ||
        value.search ||
        value.hash ||
        value.pathname !== "/"
      )
        return null;
    }
    return { url: project.origin, key, origin: origin.origin };
  } catch {
    return null;
  }
}

export function confirmationUrl(origin: string, locale: "en" | "hi") {
  return `${origin}/${locale}/auth/confirm`;
}

export function recoveryConfirmationUrl(
  origin: string,
  locale: "en" | "hi",
) {
  return `${confirmationUrl(origin, locale)}?flow=recovery`;
}
