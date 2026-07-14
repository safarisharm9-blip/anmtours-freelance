import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getServices } from "@/lib/services";
import {
  absoluteUrl,
  buildAlternates,
  buildLocaleUrl,
} from "@/config/seo";

export const revalidate = 3600;

const STATIC_PAGES = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "destinations", changeFrequency: "daily", priority: 0.9 },
  { path: "about", changeFrequency: "monthly", priority: 0.6 },
  { path: "travel-tips", changeFrequency: "monthly", priority: 0.7 },
  { path: "contact", changeFrequency: "monthly", priority: 0.6 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of STATIC_PAGES) {
    for (const locale of routing.locales) {
      entries.push({
        url: buildLocaleUrl(locale, page.path),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: buildAlternates(locale, page.path).languages,
        },
      });
    }
  }

  for (const service of services) {
    const path = `services/${service.slug}`;
    const images = [service.coverImage, ...(service.images ?? [])]
      .filter((image): image is string => Boolean(image))
      .map(absoluteUrl);

    for (const locale of routing.locales) {
      entries.push({
        url: buildLocaleUrl(locale, path),
        lastModified: service.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        images,
        alternates: {
          languages: buildAlternates(locale, path).languages,
        },
      });
    }
  }

  return entries;
}
