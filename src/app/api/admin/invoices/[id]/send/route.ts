import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { sendManualInvoiceEmail } from "@/lib/invoices/manual-invoice";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await sendManualInvoiceEmail(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send manual invoice:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invoice." },
      { status: 500 }
    );
  }
}
