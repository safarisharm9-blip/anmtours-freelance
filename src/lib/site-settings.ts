import { prisma } from "@/lib/prisma";

const DEFAULT_HERO_IMAGE_URL = "/background.jpg";
const DEFAULT_HERO_IMAGE_LABEL = "Hero background";

export async function getHeroImageSettings() {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      heroImageUrl: true,
      heroImageLabel: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    heroImageUrl: settings?.heroImageUrl || DEFAULT_HERO_IMAGE_URL,
    heroImageLabel: settings?.heroImageLabel || DEFAULT_HERO_IMAGE_LABEL,
  };
}

