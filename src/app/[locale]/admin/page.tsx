import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAllUsers, getAllServices, getAllBookings } from "@/lib/admin";
import { getServiceDetailForLocale } from "@/lib/services";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getReviews } from "@/app/actions/reviews";
// hee
type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") {
    redirect("/");
  }

  const [users, services, bookings, reviews] = await Promise.all([
    getAllUsers(),
    getAllServices(),
    getAllBookings(),
    getReviews(),
  ]);

  const servicesWithTitles = services.map((s) => ({
    ...s,
    title: getServiceDetailForLocale(s.details, locale)?.title ?? s.slug,
  }));

  const bookingsWithTitles = bookings.map((b) => ({
    ...b,
    serviceTitle:
      b.service
        ? getServiceDetailForLocale(b.service.details, locale)?.title ?? b.service.slug
        : "—",
  }));

  return (
    <div className="max-w-7xl mx-auto px-12 md:px-0 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <AdminDashboard
        users={users}
        services={servicesWithTitles}
        bookings={bookingsWithTitles}
        reviews={reviews}
      />
    </div>
  );
}
