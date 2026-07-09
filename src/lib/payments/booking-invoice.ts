import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/config/site";
import { sendEmail } from "@/lib/email/resend";

const INVOICE_SEND_LOCK_MS = 10 * 60 * 1000;

export async function sendBookingInvoiceEmail(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        select: {
          details: true,
          slug: true,
        },
      },
    },
  });

  if (!booking || booking.paymentStatus !== "PAID" || booking.invoiceEmailSentAt) {
    return;
  }

  const invoiceNumber = booking.invoiceNumber ?? buildInvoiceNumber(booking);
  const now = new Date();
  const staleLockDate = new Date(Date.now() - INVOICE_SEND_LOCK_MS);

  const claim = await prisma.booking.updateMany({
    where: {
      id: booking.id,
      paymentStatus: "PAID",
      OR: [
        { invoiceEmailSentAt: null },
        { invoiceEmailSentAt: { isSet: false } },
      ],
      AND: [
        {
          OR: [
            { invoiceEmailSendingAt: null },
            { invoiceEmailSendingAt: { isSet: false } },
            { invoiceEmailSendingAt: { lt: staleLockDate } },
          ],
        },
      ],
    },
    data: {
      invoiceNumber,
      invoiceEmailSendingAt: now,
      invoiceEmailError: null,
    },
  });

  if (claim.count === 0) {
    return;
  }

  try {
    const invoice = buildInvoiceEmail({
      booking: {
        ...booking,
        invoiceNumber,
      },
    });

    await sendEmail({
      to: [booking.user.email],
      bcc: getAdminEmailRecipients(booking.user.email),
      subject: `A&M Tours invoice ${invoiceNumber}`,
      html: invoice.html,
      text: invoice.text,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        invoiceEmailSentAt: new Date(),
        invoiceEmailSendingAt: null,
        invoiceEmailError: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invoice email.";

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        invoiceEmailSendingAt: null,
        invoiceEmailError: message,
      },
    });

    throw error;
  }
}

type BookingForInvoice = NonNullable<
  Awaited<ReturnType<typeof prisma.booking.findUnique>>
> & {
  service?: {
    details: unknown;
    slug: string;
  } | null;
};

function buildInvoiceEmail({ booking }: { booking: BookingForInvoice }) {
  const serviceTitle = getServiceTitle(booking.service?.details) ?? booking.service?.slug ?? "Tour booking";
  const customerName = [booking.user.firstName, booking.user.lastName]
    .filter(Boolean)
    .join(" ") || "Customer";
  const amount = formatMoney(booking.total, booking.currency);
  const bookingDate = formatDate(booking.date);
  const paidAt = booking.paidAt ? formatDateTime(booking.paidAt) : "Confirmed";
  const invoiceNumber = booking.invoiceNumber ?? buildInvoiceNumber(booking);

  const rows = [
    ["Invoice number", invoiceNumber],
    ["Booking ID", booking.id],
    ["Tour", serviceTitle],
    ["Travel date", bookingDate],
    ["Customer", customerName],
    ["Customer email", booking.user.email],
    ["Travelers", `${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`],
    ["Payment status", booking.paymentStatus],
    ["Paid at", paidAt],
    ["MPGS order", booking.mpgsOrderId ?? "-"],
    ["MPGS transaction", booking.mpgsTransactionId ?? "-"],
    ["Total paid", amount],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#0f172a;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  return {
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:680px;margin:0 auto;padding:28px 18px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#0f766e;color:#ffffff;padding:24px;">
          <h1 style="margin:0;font-size:24px;line-height:1.3;">A&amp;M Tours payment invoice</h1>
          <p style="margin:8px 0 0;color:#ccfbf1;">Thank you for booking with us.</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 18px;">Hi ${escapeHtml(customerName)}, your payment was confirmed successfully.</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tbody>${htmlRows}</tbody>
          </table>
          <p style="margin:22px 0 0;color:#475569;">For questions, contact us at ${escapeHtml(SITE_CONFIG.contact.email)}.</p>
        </div>
      </div>
    </div>
  </body>
</html>`,
    text: [
      "A&M Tours payment invoice",
      "",
      `Hi ${customerName}, your payment was confirmed successfully.`,
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      "",
      `For questions, contact us at ${SITE_CONFIG.contact.email}.`,
    ].join("\n"),
  };
}

function buildInvoiceNumber(booking: { id: string; createdAt: Date }) {
  const date = booking.createdAt.toISOString().slice(0, 10).replaceAll("-", "");
  return `ANM-INV-${date}-${booking.id.slice(-6).toUpperCase()}`;
}

function getAdminEmailRecipients(customerEmail: string) {
  const adminEmail = process.env.INVOICE_ADMIN_EMAIL ?? SITE_CONFIG.contact.email;
  return adminEmail.toLowerCase() === customerEmail.toLowerCase()
    ? []
    : [adminEmail];
}

function getServiceTitle(details: unknown) {
  const items = Array.isArray(details) ? details : [];
  const english = items.find(
    (item: { lang?: string }) => item?.lang === "en"
  ) as { title?: string } | undefined;
  const fallback = items[0] as { title?: string } | undefined;

  return english?.title ?? fallback?.title;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
