import type { MetadataRoute } from "next";
import { canIndex, siteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!canIndex()) return [];
  // Upcoming course pages are deliberately absent until they are published.
  return ["/en", "/hi", "/en/courses/gat-b", "/hi/courses/gat-b"].map(
    (path) => ({ url: new URL(path, siteUrl()).href }),
  );
}
