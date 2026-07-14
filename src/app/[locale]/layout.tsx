import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/components/providers/query-provider";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { SyncUser } from "@/components/auth/sync-user";
import { RtlSync } from "@/components/rtl-sync";
import { DirectionProvider } from "@/components/ui/direction";
import { isDevelopmentAdminBypassEnabled } from "@/lib/admin-auth";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

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
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <WishlistProvider>
          <RtlSync />
          <SyncUser />
          <DirectionProvider direction={locale === "ar" ? "rtl" : "ltr"}>
            <div
              className="min-h-screen flex flex-col"
              lang={locale}
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <Navbar isAdmin={isAdmin} />
              <main className="flex-1">{children}</main>
              <Footer />
              <FloatingActions />
            </div>
          </DirectionProvider>
        </WishlistProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
