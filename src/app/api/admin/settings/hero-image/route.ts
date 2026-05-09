import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// async function requireAdmin() {
//   const data = await auth();
//   console.log(data)
//   if (!userId) return false;

//   const currentUser = await prisma.user.findUnique({
//     where: { clerkId: userId },
//     select: { role: true },
//   });

//   return currentUser?.role === "ADMIN";
// }

export async function GET() {
  try {
    // const isAdmin = await requireAdmin();
    // if (!isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const settings = await prisma.siteSettings.findFirst({
      select: { id: true, heroImageUrl: true, heroImageLabel: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      heroImageUrl: settings?.heroImageUrl ?? "",
      heroImageLabel: settings?.heroImageLabel ?? "",
    });
  } catch (error) {
    console.error("Failed to fetch hero image settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero image settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // const isAdmin = await requireAdmin();
    // if (!isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const heroImageUrl =
      typeof body?.heroImageUrl === "string" ? body.heroImageUrl.trim() : "";
    const heroImageLabel =
      typeof body?.heroImageLabel === "string" ? body.heroImageLabel.trim() : "";

    const existing = await prisma.siteSettings.findFirst({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    const saved = existing
      ? await prisma.siteSettings.update({
          where: { id: existing.id },
          data: {
            heroImageUrl: heroImageUrl || null,
            heroImageLabel: heroImageLabel || null,
          },
        })
      : await prisma.siteSettings.create({
          data: {
            heroImageUrl: heroImageUrl || null,
            heroImageLabel: heroImageLabel || null,
          },
        });

    return NextResponse.json({
      heroImageUrl: saved.heroImageUrl ?? "",
      heroImageLabel: saved.heroImageLabel ?? "",
    });
  } catch (error) {
    console.error("Failed to update hero image settings:", error);
    return NextResponse.json(
      { error: "Failed to update hero image settings" },
      { status: 500 }
    );
  }
}

