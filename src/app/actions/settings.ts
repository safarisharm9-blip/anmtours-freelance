"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateHeroImageSettings(data: {
  heroImageUrl?: string;
  heroImageLabel?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
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
