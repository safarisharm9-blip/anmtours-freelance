import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { EditServiceForm } from "@/components/service/edit-service-form";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AdminEditServicePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    redirect("/");
  }

  const service = await prisma.service.findUnique({
    where: { id },
  });
  if (!service) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-16">
      <div className="">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Admin
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Edit Service
            </h1>
            <p className="mt-1 text-muted-foreground">
              Update the service details below.
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <EditServiceForm serviceId={id} />
        </div>
      </div>
    </div>
  );
}
