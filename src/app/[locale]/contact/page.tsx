import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, MapPin, ExternalLink, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_CONFIG, getWhatsAppUrl } from "@/config/site";
import { buildPageMetadata } from "@/config/seo";

const MAPS_URL =
  "https://www.google.com/maps/place/A%26M+tours+-+Sharm+El-Sheikh/@28.042814,34.429247,17z/data=!3m1!4b1!4m6!3m5!1s0x14f5db0e25636ae5:0x813319a7517ba5d4!8m2!3d28.042814!4d34.429247!16s%2Fg%2F11tdwk2scs!17m2!4m1!1e3!18m1!1e1?entry=ttu";
const MAPS_EMBED_URL =
  "https://www.google.com/maps?q=28.042814,34.429247&z=17&output=embed";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return buildPageMetadata({
    locale,
    path: "contact",
    title: t("contactTitle"),
    description: t("contactDescription"),
  });
}

function formatPhoneDisplay(phone: string): string {
  if (phone.startsWith("20") && phone.length >= 12)
    return `+20 ${phone.slice(2, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  if (phone.startsWith("20")) return `+${phone.slice(0, 2)} ${phone.slice(2)}`;
  return phone;
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");
  const { contact, whatsapp } = SITE_CONFIG;

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("getInTouch")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-lg border bg-[#25D366]/5 p-4 transition-colors hover:bg-[#25D366]/10"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <MessageCircle className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("whatsapp")}
                  </p>
                  <p className="text-base font-semibold text-[#25D366]">
                    {formatPhoneDisplay(whatsapp.phone)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("whatsappHint")}
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("email")}
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-base font-medium text-foreground hover:text-teal-600 hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="mt-0.5 size-5 shrink-0 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("phone")}
                  </p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-base font-medium text-foreground hover:text-teal-600 hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("location")}
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {contact.location}
                  </p>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline"
                  >
                    {t("viewOnMaps")}
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b bg-muted/50 px-4 py-3">
              <h2 className="font-semibold">{t("mapTitle")}</h2>
            </div>
            <div className="relative aspect-[4/3] w-full">
              <iframe
                src={MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={contact.location}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
