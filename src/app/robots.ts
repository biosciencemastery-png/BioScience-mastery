import type { MetadataRoute } from "next";
import { canIndex, siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return canIndex()
    ? {
        rules: { userAgent: "*", allow: "/" },
        sitemap: new URL("/sitemap.xml", siteUrl()).href,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
