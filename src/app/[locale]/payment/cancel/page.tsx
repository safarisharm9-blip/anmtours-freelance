import { XCircle } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PaymentCancelPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-16">
      <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <XCircle className="mx-auto mb-4 size-14 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Payment cancelled</h1>
        <p className="mt-3 text-muted-foreground">
          Your card was not charged and the booking is not confirmed. You can
          return to the tour and try again whenever you are ready.
        </p>
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
