import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getServices } from "@/lib/services";
import { DestinationsContent } from "@/components/destinations/destinations-content";
import { buildPageMetadata } from "@/config/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return buildPageMetadata({
    locale,
    path: "destinations",
    title: t("destinationsTitle"),
    description: t("destinationsDescription"),
  });
}

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Destinations");

  const services = await getServices();

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-12 md:px-0 py-8 animate-pulse">Loading destinations…</div>}>
      <DestinationsContent
        services={services}
        locale={locale}
        searchPlaceholder={t("searchPlaceholder")}
        filtersLabel={t("filtersLabel")}
        clearAllLabel={t("clearAllLabel")}
        categoryLabel={t("categoryLabel")}
        locationLabel={t("locationLabel")}
        serviceLocationLabel={t("serviceLocationLabel")}
        durationLabel={t("durationLabel")}
        priceRangeLabel={t("priceRangeLabel")}
        minPriceLabel={t("minPriceLabel")}
        maxPriceLabel={t("maxPriceLabel")}
        listingsLabel={t("listingsLabel")}
        newestLabel={t("newestLabel")}
        lowestPriceLabel={t("lowestPriceLabel")}
        highestPriceLabel={t("highestPriceLabel")}
        viewDetailsLabel={t("viewDetailsLabel")}
        fromLabel={t("fromLabel")}
        noResultsLabel={t("noResultsLabel")}
      />
    </Suspense>
  );
}
