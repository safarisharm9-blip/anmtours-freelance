"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Link, useRouter } from "@/i18n/navigation";
import { Calendar, Package, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Booking = {
  id: string;
  date: Date;
  adults: number;
  children: number;
  total: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string;
  mpgsOrderId?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl?: string | null;
    role: string;
  };
  service: {
    id: string;
    slug: string;
    details: unknown;
  } | null;
  serviceTitle: string;
};

type AdminBookingsProps = {
  bookings: Booking[];
};

export function AdminBookings({ bookings }: AdminBookingsProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (bookingId: string) => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    setDeletingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete booking");
      }
    } catch {
      alert("Failed to delete booking");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" />
          All Bookings ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No bookings yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Travelers</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">MPGS Order</th>
                  <th className="text-left py-3 px-4">Booked At</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="py-3 px-4 font-medium">
                      {format(new Date(booking.date), "PPP")}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium">
                          {booking.user.firstName || booking.user.lastName
                            ? [booking.user.firstName, booking.user.lastName]
                              .filter(Boolean)
                              .join(" ")
                            : "—"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {booking.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {booking.service ? (
                        <Link
                          href={`/services/${booking.service.slug}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Package className="size-3.5" />
                          {booking.serviceTitle}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {booking.adults} adult{booking.adults !== 1 ? "s" : ""}
                      {booking.children > 0 &&
                        `, ${booking.children} child${booking.children !== 1 ? "ren" : ""}`}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {booking.currency ?? "USD"} {booking.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={
                            booking.paymentStatus === "PAID"
                              ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700"
                              : booking.paymentStatus === "FAILED" ||
                                  booking.paymentStatus === "CANCELLED"
                                ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                                : "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700"
                          }
                        >
                          {booking.paymentStatus}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {booking.bookingStatus}
                        </span>
                        {booking.paidAt && (
                          <span className="block text-xs text-muted-foreground">
                            Paid {format(new Date(booking.paidAt), "PPp")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {booking.mpgsOrderId ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {format(new Date(booking.createdAt), "PPp")}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(booking.id)}
                        disabled={deletingId === booking.id}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        title="Delete booking"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
