import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CalendarDays, CreditCard, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getServiceDetailForLocale } from "@/lib/services";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) {
    redirect(`/${locale}`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, firstName: true, lastName: true },
  });

  const bookings = user
    ? await prisma.booking.findMany({
        where: { user: { is: { id: user.id } } },
        include: { service: true },
        orderBy: { date: "desc" },
      })
    : [];

  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">My account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
          {displayName ? `${displayName}'s bookings` : "My bookings"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          View your upcoming trips and complete booking history.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <CalendarDays className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No bookings yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your booked tours will appear here.
            </p>
            <Link
              href="/destinations"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore tours
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const title = booking.service
              ? getServiceDetailForLocale(booking.service.details, locale)?.title ??
                booking.service.slug
              : "Tour unavailable";
            const status = statusLabel(booking.bookingStatus, booking.paymentStatus);

            return (
              <Card key={booking.id}>
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    {booking.service && (
                      <Link
                        href={`/services/${booking.service.slug}`}
                        className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                      >
                        View tour details
                      </Link>
                    )}
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-5 border-t pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem
                      icon={<CalendarDays className="size-4" />}
                      label="Travel date"
                      value={formatDate(booking.date, locale)}
                    />
                    <InfoItem
                      icon={<Users className="size-4" />}
                      label="Travelers"
                      value={`${booking.adults} adult${booking.adults === 1 ? "" : "s"}${
                        booking.children > 0
                          ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
                          : ""
                      }`}
                    />
                    <InfoItem
                      icon={<CreditCard className="size-4" />}
                      label="Total"
                      value={new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: booking.currency,
                      }).format(booking.total)}
                    />
                    <InfoItem
                      icon={<MapPin className="size-4" />}
                      label="Booked on"
                      value={formatDate(booking.createdAt, locale)}
                    />
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                    <span>Booking ID: {booking.id}</span>
                    {booking.mpgsOrderId && <span>Order: {booking.mpgsOrderId}</span>}
                    <span>Payment: {booking.paymentStatus.replaceAll("_", " ")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(bookingStatus: string, paymentStatus: string) {
  if (bookingStatus === "CONFIRMED" || paymentStatus === "PAID") {
    return { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-700" };
  }
  if (bookingStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return { label: "Cancelled", className: "bg-destructive/10 text-destructive" };
  }
  if (bookingStatus === "PAYMENT_FAILED" || paymentStatus === "FAILED") {
    return { label: "Payment failed", className: "bg-destructive/10 text-destructive" };
  }
  if (bookingStatus === "EXPIRED") {
    return { label: "Expired", className: "bg-muted text-muted-foreground" };
  }
  return { label: "Payment pending", className: "bg-amber-500/10 text-amber-700" };
}
