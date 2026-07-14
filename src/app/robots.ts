import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SEO_CONFIG } from "@/config/seo";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = routing.locales.flatMap((locale) => [
    `/${locale}/admin/`,
    `/${locale}/profile/`,
    `/${locale}/payment/`,
    `/${locale}/chat/`,
    `/${locale}/services/add/`,
  ]);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...privatePaths],
    },
    sitemap: `${SEO_CONFIG.getBaseUrl()}/sitemap.xml`,
    host: SEO_CONFIG.getBaseUrl(),
  };
}
