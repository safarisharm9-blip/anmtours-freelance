import { prisma } from "@/lib/prisma";

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllBookings() {
  return prisma.booking.findMany({
    include: { service: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllManualInvoices() {
  return prisma.manualInvoice.findMany({
    orderBy: { createdAt: "desc" },
  });
}
