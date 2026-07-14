"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth";

export async function updateHeroImageSettings(data: {
  heroImageUrl?: string;
  heroImageLabel?: string;
}) {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return { success: false, error: "Forbidden" };
    }

    const heroImageUrl = data.heroImageUrl?.trim() || null;
    const heroImageLabel = data.heroImageLabel?.trim() || null;

    const existing = await prisma.siteSettings.findFirst({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.siteSettings.update({
        where: { id: existing.id },
        data: { heroImageUrl, heroImageLabel },
      });
    } else {
      await prisma.siteSettings.create({
        data: { heroImageUrl, heroImageLabel },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update hero image settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
