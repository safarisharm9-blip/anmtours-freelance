import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export type Locale = (typeof routing.locales)[number];

const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  ar: "ar_EG",
  ru: "ru_RU",
  it: "it_IT",
};

export const SEO_CONFIG = {
  siteName: "A&M Tours",
  defaultDescription:
    "Discover curated tours, Red Sea adventures, desert safaris, and unforgettable experiences in Sharm El Sheikh and across Egypt.",
  ogImage: "/logo.jpeg",
  getBaseUrl: (): string => {
    if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
    }
    return "https://anm-tours.vercel.app";
  },
} as const;

export const NO_INDEX_METADATA: Metadata = {
  alternates: { canonical: null, languages: {} },
  openGraph: null,
  twitter: null,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export function buildLocaleUrl(locale: string, path = ""): string {
  const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return `${SEO_CONFIG.getBaseUrl()}/${locale}${cleanPath ? `/${cleanPath}` : ""}`;
}

export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SEO_CONFIG.getBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

export function buildAlternates(locale: string, path = ""): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  for (const supportedLocale of routing.locales) {
    languages[supportedLocale] = buildLocaleUrl(supportedLocale, path);
  }
  languages["x-default"] = buildLocaleUrl(routing.defaultLocale, path);

  return {
    canonical: buildLocaleUrl(locale, path),
    languages,
  };
}

type PageMetadataOptions = {
  locale: string;
  path?: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
};

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  image,
  type = "website",
}: PageMetadataOptions): Metadata {
  const { canonical, languages } = buildAlternates(locale, path);
  const socialImage = absoluteUrl(image || SEO_CONFIG.ogImage);
  const typedLocale = routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type,
      url: canonical,
      siteName: SEO_CONFIG.siteName,
      locale: OG_LOCALES[typedLocale],
      alternateLocale: routing.locales
        .filter((item) => item !== typedLocale)
        .map((item) => OG_LOCALES[item]),
      title,
      description,
      images: [{ url: socialImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
