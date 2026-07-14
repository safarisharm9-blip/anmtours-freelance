import { randomBytes } from "node:crypto";
import PDFDocument from "pdfkit";
import { z } from "zod";
import type {
  ManualInvoice,
  ManualInvoiceItem,
  ManualInvoiceStatus,
} from "@prisma/client";
import { SITE_CONFIG } from "@/config/site";
import { sendEmail } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

const INVOICE_SEND_LOCK_MS = 10 * 60 * 1000;
const moneySchema = z.coerce.number().finite().min(0).max(100_000_000);

export const manualInvoiceInputSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().max(50).optional().default(""),
  customerAddress: z.string().trim().max(500).optional().default(""),
  travelDate: z.string().trim().optional().nullable(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  items: z.array(z.object({
    description: z.string().trim().min(1).max(300),
    quantity: z.coerce.number().finite().positive().max(10_000),
    unitPrice: moneySchema,
  })).min(1).max(30),
  discountAmount: moneySchema.default(0),
  taxRate: z.coerce.number().finite().min(0).max(100).default(0),
  amountPaid: moneySchema.default(0),
  status: z.enum([
    "DRAFT",
    "UNPAID",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
    "REFUNDED",
  ]),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]),
  notes: z.string().trim().max(2_000).optional().default(""),
});

export type ManualInvoiceInput = z.infer<typeof manualInvoiceInputSchema>;

export function prepareManualInvoiceData(input: ManualInvoiceInput) {
  const items = input.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: roundMoney(item.unitPrice),
    lineTotal: roundMoney(item.quantity * item.unitPrice),
  }));
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const discountAmount = Math.min(roundMoney(input.discountAmount), subtotal);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = roundMoney(taxableAmount * (input.taxRate / 100));
  const total = roundMoney(taxableAmount + taxAmount);
  const requestedAmountPaid = Math.min(roundMoney(input.amountPaid), total);

  const status: ManualInvoiceStatus = input.status;
  let amountPaid = requestedAmountPaid;

  if (status === "PAID") {
    amountPaid = total;
  } else if (status === "UNPAID" || status === "DRAFT") {
    amountPaid = 0;
  } else if (status === "PARTIALLY_PAID") {
    if (amountPaid <= 0 || amountPaid >= total) {
      throw new Error("A partially paid invoice needs an amount greater than zero and less than the total.");
    }
  }

  if (total <= 0) {
    throw new Error("Invoice total must be greater than zero.");
  }

  return {
    customerName: input.customerName,
    customerEmail: input.customerEmail.toLowerCase(),
    customerPhone: input.customerPhone || null,
    customerAddress: input.customerAddress || null,
    travelDate: parseOptionalDate(input.travelDate),
    currency: input.currency,
    items,
    subtotal,
    discountAmount,
    taxRate: input.taxRate,
    taxAmount,
    total,
    amountPaid,
    status,
    paymentMethod: input.paymentMethod,
    notes: input.notes || null,
    paidAt: status === "PAID" ? new Date() : null,
  };
}

export function buildManualInvoiceNumber(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ANM-INV-${datePart}-${suffix}`;
}

export async function sendManualInvoiceEmail(invoiceId: string) {
  const invoice = await prisma.manualInvoice.findUnique({ where: { id: invoiceId } });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const now = new Date();
  const staleLockDate = new Date(Date.now() - INVOICE_SEND_LOCK_MS);
  const claim = await prisma.manualInvoice.updateMany({
    where: {
      id: invoice.id,
      OR: [
        { emailSendingAt: null },
        { emailSendingAt: { isSet: false } },
        { emailSendingAt: { lt: staleLockDate } },
      ],
    },
    data: {
      emailSendingAt: now,
      emailError: null,
    },
  });

  if (claim.count === 0) {
    throw new Error("This invoice is already being sent.");
  }

  try {
    const email = buildManualInvoiceEmail(invoice);
    const pdf = await generateManualInvoicePdf(invoice);

    await sendEmail({
      to: [invoice.customerEmail],
      bcc: getAdminEmailRecipients(invoice.customerEmail),
      subject: `A&M Tours invoice ${invoice.invoiceNumber}`,
      html: email.html,
      text: email.text,
      attachments: [{
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdf.toString("base64"),
      }],
    });

    await prisma.manualInvoice.update({
      where: { id: invoice.id },
      data: {
        emailSentAt: new Date(),
        emailSendingAt: null,
        emailError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send invoice email.";
    await prisma.manualInvoice.update({
      where: { id: invoice.id },
      data: {
        emailSendingAt: null,
        emailError: message,
      },
    });
    throw error;
  }
}

export function generateManualInvoicePdf(invoice: ManualInvoice) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 96;
    const rightEdge = 48 + pageWidth;
    const muted = "#5f6b76";
    const dark = "#14213d";
    const accent = "#0f766e";

    doc.rect(0, 0, doc.page.width, 112).fill(dark);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("A&M TOURS", 48, 40);
    doc.font("Helvetica").fontSize(10).fillColor("#dbe4ee").text(SITE_CONFIG.contact.location, 48, 72);
    doc.text(SITE_CONFIG.contact.email, 48, 87);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(23).text("INVOICE", 360, 40, { width: rightEdge - 360, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#dbe4ee").text(invoice.invoiceNumber, 330, 74, { width: rightEdge - 330, align: "right" });

    let y = 142;
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(9).text("BILL TO", 48, y);
    doc.fillColor(dark).fontSize(14).text(invoice.customerName, 48, y + 18);
    doc.fillColor(muted).font("Helvetica").fontSize(10).text(invoice.customerEmail, 48, y + 39);
    if (invoice.customerPhone) doc.text(invoice.customerPhone, 48, y + 54);
    if (invoice.customerAddress) doc.text(invoice.customerAddress, 48, y + 69, { width: 250 });

    const metaX = 350;
    drawPdfMetaRow(doc, "Issued", formatDate(invoice.createdAt), metaX, y, rightEdge);
    drawPdfMetaRow(doc, "Travel date", invoice.travelDate ? formatDate(invoice.travelDate) : "-", metaX, y + 20, rightEdge);
    drawPdfMetaRow(doc, "Status", humanize(invoice.status), metaX, y + 40, rightEdge);
    drawPdfMetaRow(doc, "Payment", humanize(invoice.paymentMethod), metaX, y + 60, rightEdge);

    y = Math.max(254, doc.y + 24);
    y = drawPdfItems(doc, invoice.items, invoice.currency, y, rightEdge);
    y += 16;

    const totalsX = 340;
    y = drawPdfTotalRow(doc, "Subtotal", formatMoney(invoice.subtotal, invoice.currency), totalsX, y, rightEdge);
    if (invoice.discountAmount > 0) y = drawPdfTotalRow(doc, "Discount", `-${formatMoney(invoice.discountAmount, invoice.currency)}`, totalsX, y, rightEdge);
    if (invoice.taxAmount > 0) y = drawPdfTotalRow(doc, `Tax (${invoice.taxRate}%)`, formatMoney(invoice.taxAmount, invoice.currency), totalsX, y, rightEdge);
    doc.moveTo(totalsX, y + 2).lineTo(rightEdge, y + 2).strokeColor("#cbd5e1").stroke();
    y += 12;
    doc.fillColor(dark).font("Helvetica-Bold").fontSize(12).text("Total", totalsX, y);
    doc.text(formatMoney(invoice.total, invoice.currency), totalsX, y, { width: rightEdge - totalsX, align: "right" });
    y += 24;
    doc.fillColor(muted).font("Helvetica").fontSize(10).text("Amount paid", totalsX, y);
    doc.text(formatMoney(invoice.amountPaid, invoice.currency), totalsX, y, { width: rightEdge - totalsX, align: "right" });
    y += 18;
    doc.fillColor(accent).font("Helvetica-Bold").text("Balance due", totalsX, y);
    doc.text(formatMoney(getBalanceDue(invoice), invoice.currency), totalsX, y, { width: rightEdge - totalsX, align: "right" });

    if (invoice.notes) {
      y = Math.max(y + 48, doc.y + 36);
      if (y > 700) {
        doc.addPage();
        y = 56;
      }
      doc.fillColor(accent).font("Helvetica-Bold").fontSize(9).text("NOTES", 48, y);
      doc.fillColor(muted).font("Helvetica").fontSize(10).text(invoice.notes, 48, y + 18, { width: pageWidth });
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.fillColor("#94a3b8").font("Helvetica").fontSize(8).text(
        `A&M Tours  |  ${SITE_CONFIG.contact.phone}  |  Page ${i + 1} of ${range.count}`,
        48,
        doc.page.height - 38,
        { width: pageWidth, align: "center" }
      );
    }

    doc.end();
  });
}

function buildManualInvoiceEmail(invoice: ManualInvoice) {
  const balance = getBalanceDue(invoice);
  const itemRows = invoice.items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;">${escapeHtml(item.description)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatMoney(item.unitPrice, invoice.currency))}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${escapeHtml(formatMoney(item.lineTotal, invoice.currency))}</td>
    </tr>`).join("");

  const summary = [
    ["Subtotal", formatMoney(invoice.subtotal, invoice.currency)],
    ...(invoice.discountAmount ? [["Discount", `-${formatMoney(invoice.discountAmount, invoice.currency)}`]] : []),
    ...(invoice.taxAmount ? [[`Tax (${invoice.taxRate}%)`, formatMoney(invoice.taxAmount, invoice.currency)]] : []),
    ["Total", formatMoney(invoice.total, invoice.currency)],
    ["Amount paid", formatMoney(invoice.amountPaid, invoice.currency)],
    ["Balance due", formatMoney(balance, invoice.currency)],
  ];

  const summaryRows = summary.map(([label, value]) => `
    <tr>
      <td style="padding:6px 0;color:#64748b;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;text-align:right;font-weight:600;color:#0f172a;">${escapeHtml(value)}</td>
    </tr>`).join("");

  return {
    html: `<!doctype html>
<html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="max-width:720px;margin:0 auto;padding:28px 18px;">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:#14213d;color:#ffffff;padding:24px;">
        <h1 style="margin:0;font-size:24px;">A&amp;M Tours invoice</h1>
        <p style="margin:8px 0 0;color:#dbe4ee;">${escapeHtml(invoice.invoiceNumber)}</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 6px;">Hi ${escapeHtml(invoice.customerName)},</p>
        <p style="margin:0 0 22px;color:#475569;">Your invoice is attached as a PDF. A summary is included below.</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:10px 12px;text-align:left;">Description</th><th style="padding:10px 12px;text-align:right;">Qty</th><th style="padding:10px 12px;text-align:right;">Price</th><th style="padding:10px 12px;text-align:right;">Amount</th>
          </tr></thead><tbody>${itemRows}</tbody>
        </table>
        <table style="width:280px;margin:18px 0 0 auto;border-collapse:collapse;">${summaryRows}</table>
        <p style="margin:24px 0 0;color:#475569;">Status: <strong>${escapeHtml(humanize(invoice.status))}</strong></p>
        <p style="margin:10px 0 0;color:#475569;">Questions? Contact ${escapeHtml(SITE_CONFIG.contact.email)}.</p>
      </div>
    </div>
  </div>
</body></html>`,
    text: [
      `A&M Tours invoice ${invoice.invoiceNumber}`,
      "",
      `Hi ${invoice.customerName}, your invoice is attached as a PDF.`,
      "",
      ...invoice.items.map((item) => `${item.description}: ${item.quantity} x ${formatMoney(item.unitPrice, invoice.currency)} = ${formatMoney(item.lineTotal, invoice.currency)}`),
      "",
      ...summary.map(([label, value]) => `${label}: ${value}`),
      `Status: ${humanize(invoice.status)}`,
      "",
      `Questions? Contact ${SITE_CONFIG.contact.email}.`,
    ].join("\n"),
  };
}

function drawPdfItems(doc: PDFKit.PDFDocument, items: ManualInvoiceItem[], currency: string, startY: number, rightEdge: number) {
  let y = startY;
  const drawHeader = () => {
    doc.rect(48, y, rightEdge - 48, 28).fill("#e8eef4");
    doc.fillColor("#14213d").font("Helvetica-Bold").fontSize(9);
    doc.text("DESCRIPTION", 58, y + 9, { width: 260 });
    doc.text("QTY", 328, y + 9, { width: 44, align: "right" });
    doc.text("UNIT PRICE", 382, y + 9, { width: 82, align: "right" });
    doc.text("AMOUNT", 474, y + 9, { width: rightEdge - 474, align: "right" });
    y += 28;
  };

  drawHeader();
  for (const item of items) {
    const rowHeight = Math.max(34, doc.heightOfString(item.description, { width: 250 }) + 16);
    if (y + rowHeight > doc.page.height - 72) {
      doc.addPage();
      y = 48;
      drawHeader();
    }
    doc.fillColor("#334155").font("Helvetica").fontSize(9);
    doc.text(item.description, 58, y + 10, { width: 250 });
    doc.text(formatQuantity(item.quantity), 328, y + 10, { width: 44, align: "right" });
    doc.text(formatMoney(item.unitPrice, currency), 382, y + 10, { width: 82, align: "right" });
    doc.text(formatMoney(item.lineTotal, currency), 474, y + 10, { width: rightEdge - 474, align: "right" });
    doc.moveTo(48, y + rowHeight).lineTo(rightEdge, y + rowHeight).strokeColor("#e2e8f0").stroke();
    y += rowHeight;
  }
  return y;
}

function drawPdfMetaRow(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, rightEdge: number) {
  doc.fillColor("#64748b").font("Helvetica").fontSize(9).text(label, x, y);
  doc.fillColor("#14213d").font("Helvetica-Bold").text(value, x, y, { width: rightEdge - x, align: "right" });
}

function drawPdfTotalRow(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, rightEdge: number) {
  doc.fillColor("#64748b").font("Helvetica").fontSize(10).text(label, x, y);
  doc.fillColor("#14213d").text(value, x, y, { width: rightEdge - x, align: "right" });
  return y + 19;
}

function getAdminEmailRecipients(customerEmail: string) {
  const adminEmail = (process.env.INVOICE_ADMIN_EMAIL?.trim() || SITE_CONFIG.contact.email).trim();
  return adminEmail.toLowerCase() === customerEmail.toLowerCase() ? [] : [adminEmail];
}

function getBalanceDue(invoice: Pick<ManualInvoice, "status" | "total" | "amountPaid">) {
  if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") {
    return 0;
  }
  return Math.max(0, invoice.total - invoice.amountPaid);
}

function parseOptionalDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) throw new Error("Travel date is invalid.");
  return date;
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
}

export function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
