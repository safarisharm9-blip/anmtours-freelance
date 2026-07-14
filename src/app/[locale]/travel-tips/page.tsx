import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SITE_CONFIG } from "@/config/site";
import { buildPageMetadata } from "@/config/seo";
import {
  AlertCircle,
  FileText,
  Phone,
  Shield,
  Sun,
  MapPin,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return buildPageMetadata({
    locale,
    path: "travel-tips",
    title: t("travelTipsTitle"),
    description: t("travelTipsDescription"),
  });
}

export default async function TravelTipsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("TravelTips");

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-10">{t("subtitle")}</p>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="size-5" />
            <h2 className="text-xl font-semibold">{t("beforeTravel")}</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              <strong className="text-foreground">{t("visa")}:</strong> {t("visaDesc")}
            </p>
            <p>
              <strong className="text-foreground">{t("packing")}:</strong> {t("packingDesc")}
            </p>
            <p>
              <strong className="text-foreground">{t("tipping")}:</strong> {t("tippingDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Sun className="size-5" />
            <h2 className="text-xl font-semibold">{t("bestTime")}</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              <strong className="text-foreground">{t("sharmElSheikh")}:</strong> {t("sharmDesc")}
            </p>
            <p>
              <strong className="text-foreground">{t("desertActivities")}:</strong> {t("desertDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="size-5" />
            <h2 className="text-xl font-semibold">{t("emergencyContacts")}</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" />
              <span>{t("police")}: {SITE_CONFIG.emergency.police}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" />
              <span>{t("ambulance")}: {SITE_CONFIG.emergency.ambulance}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" />
              <span>{t("touristPolice")}: {SITE_CONFIG.emergency.touristPolice}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{t("embassyInfo")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <MapPin className="size-5" />
            <h2 className="text-xl font-semibold">{t("localTips")}</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              <strong className="text-foreground">{t("stayHydrated")}:</strong> {t("stayHydratedDesc")}
            </p>
            <p>
              <strong className="text-foreground">{t("respectCustoms")}:</strong> {t("respectCustomsDesc")}
            </p>
            <p>
              <strong className="text-foreground">{t("bargaining")}:</strong> {t("bargainingDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="size-5" />
            <h2 className="text-xl font-semibold">{t("needHelp")}</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{t("needHelpDesc")}</p>
            <div className="space-y-2">
              <a
                href={`mailto:${SITE_CONFIG.contact.email}`}
                className="block text-primary hover:underline"
              >
                {SITE_CONFIG.contact.email}
              </a>
              <a
                href={`tel:${SITE_CONFIG.contact.phone}`}
                className="block text-primary hover:underline"
              >
                {SITE_CONFIG.contact.phone}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
