import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  getAllUsers,
  getAllServices,
  getAllBookings,
  getAllManualInvoices,
} from "@/lib/admin";
import { getServiceDetailForLocale } from "@/lib/services";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getReviews } from "@/app/actions/reviews";
type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    redirect("/");
  }

  const [users, services, bookings, reviews, manualInvoices] = await Promise.all([
    getAllUsers(),
    getAllServices(),
    getAllBookings(),
    getReviews(),
    getAllManualInvoices(),
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Admin Dash board</h1>
      <AdminDashboard
        users={users}
        services={servicesWithTitles}
        bookings={bookingsWithTitles}
        reviews={reviews}
        manualInvoices={manualInvoices}
      />
    </div>
  );
}
