import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  buildManualInvoiceNumber,
  manualInvoiceInputSchema,
  prepareManualInvoiceData,
} from "@/lib/invoices/manual-invoice";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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

    const data = prepareManualInvoiceData(parsed.data);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const invoice = await prisma.manualInvoice.create({
          data: {
            ...data,
            invoiceNumber: buildManualInvoiceNumber(),
            createdByClerkId: admin.clerkId,
            emailSentAt: null,
            emailSendingAt: null,
            emailError: null,
          },
        });
        return NextResponse.json({ invoice }, { status: 201 });
      } catch (error) {
        const duplicateNumber =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (!duplicateNumber || attempt === 2) throw error;
      }
    }

    return NextResponse.json({ error: "Failed to generate an invoice number." }, { status: 500 });
  } catch (error) {
    console.error("Failed to create manual invoice:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to create invoice.") }, { status: 500 });
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
