import { getCurrentAdmin } from "@/lib/admin-auth";
import { generateManualInvoicePdf } from "@/lib/invoices/manual-invoice";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.manualInvoice.findUnique({ where: { id } });
  if (!invoice) {
    return Response.json({ error: "Invoice not found." }, { status: 404 });
  }

  const pdf = await generateManualInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
