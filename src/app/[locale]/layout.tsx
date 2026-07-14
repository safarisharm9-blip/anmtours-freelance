import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/components/providers/query-provider";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { SyncUser } from "@/components/auth/sync-user";
import { JsonLd } from "@/components/seo/json-ld";
import { DirectionProvider } from "@/components/ui/direction";
import { isDevelopmentAdminBypassEnabled } from "@/lib/admin-auth";
import { SITE_CONFIG } from "@/config/site";
import {
  absoluteUrl,
  buildLocaleUrl,
  buildPageMetadata,
  SEO_CONFIG,
} from "@/config/seo";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    ...buildPageMetadata({ locale, title, description }),
    metadataBase: new URL(SEO_CONFIG.getBaseUrl()),
    title: {
      default: `${title} | ${SEO_CONFIG.siteName}`,
      template: `%s | ${SEO_CONFIG.siteName}`,
    },
    applicationName: SEO_CONFIG.siteName,
    authors: [{ name: SEO_CONFIG.siteName, url: SEO_CONFIG.getBaseUrl() }],
    creator: SEO_CONFIG.siteName,
    publisher: SEO_CONFIG.siteName,
    category: "travel",
    keywords: [
      "Sharm El Sheikh tours",
      "Egypt tours",
      "Red Sea excursions",
      "desert safari Sharm El Sheikh",
      "Egypt travel agency",
    ],
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/logo.jpeg",
      shortcut: "/logo.jpeg",
      apple: "/logo.jpeg",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const canonicalUrl = buildLocaleUrl(locale);
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SEO_CONFIG.getBaseUrl()}/#organization`,
    name: SEO_CONFIG.siteName,
    url: canonicalUrl,
    logo: absoluteUrl(SEO_CONFIG.ogImage),
    image: absoluteUrl(SEO_CONFIG.ogImage),
    email: SITE_CONFIG.contact.email,
    telephone: SITE_CONFIG.contact.phone,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sharm El Sheikh",
      addressCountry: "EG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 28.042814,
      longitude: 34.429247,
    },
    areaServed: {
      "@type": "Country",
      name: "Egypt",
    },
    availableLanguage: ["English", "Arabic", "Russian", "Italian"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.contact.phone,
      contactType: "customer service",
      availableLanguage: ["English", "Arabic", "Russian", "Italian"],
    },
  };

  const { userId } = await auth();
  let isAdmin = isDevelopmentAdminBypassEnabled();
  if (!isAdmin && userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    } catch {
      // DB may be unavailable during build (e.g. Vercel without DATABASE_URL)
      isAdmin = false;
    }
  }

  return (
    <ClerkProvider>
      <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <head>
          <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://utfs.io" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://img.clerk.com" crossOrigin="anonymous" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <JsonLd data={organizationSchema} />
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              <WishlistProvider>
                <SyncUser />
                <DirectionProvider direction={locale === "ar" ? "rtl" : "ltr"}>
                  <div className="flex min-h-screen flex-col">
                    <Navbar isAdmin={isAdmin} />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <FloatingActions />
                  </div>
                </DirectionProvider>
              </WishlistProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
