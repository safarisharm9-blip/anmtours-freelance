import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export function isDevelopmentAdminBypassEnabled() {
  return process.env.NODE_ENV === "development";
}

export async function getCurrentAdmin() {
  if (isDevelopmentAdminBypassEnabled()) {
    return {
      id: "development-admin",
      clerkId: "development-admin",
      email: null,
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      clerkId: userId,
      role: "ADMIN",
    },
    select: {
      id: true,
      clerkId: true,
      email: true,
    },
  });
}
