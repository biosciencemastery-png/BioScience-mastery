export function siteUrl() {
  const candidate =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return new URL(candidate);
}
export function canIndex() {
  return (
    process.env.ALLOW_INDEXING === "true" &&
    process.env.VERCEL_ENV !== "preview" &&
    siteUrl().protocol === "https:"
  );
}
