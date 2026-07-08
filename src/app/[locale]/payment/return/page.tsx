import { CheckCircle2, XCircle } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { confirmBookingPayment } from "@/lib/payments/booking-payment";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    bookingId?: string;
    resultIndicator?: string;
  }>;
};

export default async function PaymentReturnPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { bookingId, resultIndicator } = await searchParams;
  setRequestLocale(locale);

  const result = await confirmBookingPayment({
    bookingId,
    resultIndicator,
  }).catch((error) => {
    console.error("Failed to confirm payment return:", error);
    return {
      ok: false,
      paid: false,
      message:
        "We could not confirm the payment automatically. Please contact us with your booking details.",
    };
  });

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-16">
      <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        {result.paid ? (
          <CheckCircle2 className="mx-auto mb-4 size-14 text-emerald-600" />
        ) : (
          <XCircle className="mx-auto mb-4 size-14 text-destructive" />
        )}
        <h1 className="text-2xl font-bold">
          {result.paid ? "Payment confirmed" : "Payment not completed"}
        </h1>
        <p className="mt-3 text-muted-foreground">{result.message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
