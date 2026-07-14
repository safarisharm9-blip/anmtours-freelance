import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  manualInvoiceInputSchema,
  prepareManualInvoiceData,
} from "@/lib/invoices/manual-invoice";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = manualInvoiceInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid invoice data." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const existing = await prisma.manualInvoice.findUnique({
      where: { id },
      select: { paidAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const data = prepareManualInvoiceData(parsed.data);
    const invoice = await prisma.manualInvoice.update({
      where: { id },
      data: {
        ...data,
        paidAt: data.status === "PAID" ? existing.paidAt ?? new Date() : null,
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Failed to update manual invoice:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update invoice." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.manualInvoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete manual invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice." }, { status: 500 });
  }
}
