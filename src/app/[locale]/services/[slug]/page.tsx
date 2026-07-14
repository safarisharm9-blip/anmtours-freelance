import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  getServiceBySlug,
  getServiceDetailForLocale,
  getArrayForLocale,
} from "@/lib/services";
import { AnimatedSection } from "@/components/home/animated-section";
import { ServiceBreadcrumbs } from "@/components/service-detail/service-breadcrumbs";
import { ServiceHeader } from "@/components/service-detail/service-header";
import { ServiceGallery } from "@/components/service-detail/service-gallery";
import { ServiceTabs } from "@/components/service-detail/service-tabs";
import { BookingSidebar } from "@/components/service-detail/booking-sidebar";
import { HelpSection } from "@/components/service-detail/help-section";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildLocaleUrl,
  buildPageMetadata,
  NO_INDEX_METADATA,
  SEO_CONFIG,
} from "@/config/seo";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

function plainText(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metaDescription(value: string, fallback: string): string {
  const text = plainText(value) || fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return NO_INDEX_METADATA;

  const t = await getTranslations({ locale, namespace: "Metadata" });
  const detail = getServiceDetailForLocale(service.details, locale);
  const title = detail?.title || slug.replaceAll("-", " ");
  const description = metaDescription(
    detail?.description || "",
    t("tourFallbackDescription")
  );

  return buildPageMetadata({
    locale,
    path: `services/${slug}`,
    title,
    description,
    image: service.coverImage,
  });
}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Service");

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const detail = getServiceDetailForLocale(service.details, locale);
  const title = detail?.title ?? "Untitled";
  const description = detail?.description ?? "";
  const seoDescription = metaDescription(
    description,
    (await getTranslations({ locale, namespace: "Metadata" }))("tourFallbackDescription")
  );
  const highlights = getArrayForLocale(service.highlights, locale);
  const includes = getArrayForLocale(service.includes, locale);
  const excludes = getArrayForLocale(service.excludes, locale);
  const goodToKnow = getArrayForLocale(service.goodToKnow, locale);
  const serviceUrl = buildLocaleUrl(locale, `services/${slug}`);
  const images = [service.coverImage, ...(service.images ?? [])]
    .filter((image): image is string => Boolean(image))
    .map(absoluteUrl);
  const tourSchema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${serviceUrl}#tour`,
    name: title,
    description: seoDescription,
    url: serviceUrl,
    image: images,
    touristType: service.category || undefined,
    provider: {
      "@id": `${SEO_CONFIG.getBaseUrl()}/#organization`,
    },
    offers: {
      "@type": "Offer",
      url: serviceUrl,
      price: service.priceAdult,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: buildLocaleUrl(locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("tours"),
        item: buildLocaleUrl(locale, "destinations"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: serviceUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[tourSchema, breadcrumbSchema]} />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <AnimatedSection fast>
          <ServiceBreadcrumbs
            title={title}
            category={service.category}
            homeLabel={t("home")}
            toursLabel={t("tours")}
          />
        </AnimatedSection>

        <AnimatedSection className="mt-6" fast>
          <ServiceHeader
            title={title}
            duration={service.duration}
            maxParticipants={service.maxParticipants}
          />
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <ServiceGallery
            coverImage={service.coverImage}
            images={service.images ?? []}
            title={title}
            viewAllPhotosLabel={t("viewAllPhotos", {
              count: (service.coverImage ? 1 : 0) + (service.images?.length ?? 0),
            })}
          />
        </AnimatedSection>

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <AnimatedSection className="lg:col-span-2 rtl:text-right rtl:items-end">
            <ServiceTabs
              description={description}
              highlights={highlights}
              includes={includes}
              excludes={excludes}
              goodToKnow={goodToKnow}
              location={service.location}
              overviewTabLabel={t("overview")}
              highlightsLabel={t("highlights")}
              descriptionLabel={t("description")}
              includesTabLabel={t("whatIncluded")}
              excludesTabLabel={t("excludes")}
              goodToKnowTabLabel={t("goodToKnow")}
              locationTabLabel={t("locationTab")}
              faqTabLabel={t("faq")}
            />
          </AnimatedSection>

          <AnimatedSection className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <BookingSidebar
                serviceId={service.id}
                priceAdult={service.priceAdult}
                priceKids={service.priceKids}
                perPersonLabel={t("perPerson")}
                selectDatesLabel={t("selectDates")}
                travelersLabel={t("travelers")}
                travelersHintLabel={t("travelersHint")}
                adultsLabel={t("adults")}
                childrenLabel={t("children")}
                infantsLabel={t("infants")}
                localTaxesLabel={t("localTaxes")}
                totalLabel={t("total")}
                bookButtonLabel={t("bookButton")}
                secureLabel={t("secureBooking")}
              />
              {/* <DemandNotification message={t("highDemand")} /> */}
              <HelpSection
                title={t("needHelp")}
                description={t("helpDesc")}
                buttonLabel={t("chatExpert")}
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
