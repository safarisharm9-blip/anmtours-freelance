import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendBookingInvoiceEmail } from "./booking-invoice";
import { getMpgsOrderSummary, retrieveMpgsOrder } from "./mpgs";

type ConfirmBookingPaymentInput = {
  bookingId?: string;
  orderId?: string;
  resultIndicator?: string;
  rawOrder?: unknown;
};

export type ConfirmBookingPaymentResult = {
  ok: boolean;
  paid: boolean;
  message: string;
  bookingId?: string;
};

export async function confirmBookingPayment({
  bookingId,
  orderId,
  resultIndicator,
  rawOrder,
}: ConfirmBookingPaymentInput): Promise<ConfirmBookingPaymentResult> {
  const booking = bookingId
    ? await prisma.booking.findUnique({ where: { id: bookingId } })
    : orderId
      ? await prisma.booking.findFirst({ where: { mpgsOrderId: orderId } })
      : null;

  if (!booking) {
    return {
      ok: false,
      paid: false,
      message: "Booking not found.",
    };
  }

  if (booking.paymentStatus === "PAID") {
    await sendBookingInvoiceEmail(booking.id).catch((error) => {
      console.error("Failed to send booking invoice email:", error);
    });

    return {
      ok: true,
      paid: true,
      bookingId: booking.id,
      message: "Payment already confirmed. Your booking is complete.",
    };
  }

  if (
    resultIndicator &&
    booking.mpgsSuccessIndicator &&
    resultIndicator !== booking.mpgsSuccessIndicator
  ) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        mpgsResultIndicator: resultIndicator,
        bookingStatus: "PAYMENT_FAILED",
        paymentStatus: "FAILED",
        paymentFailedAt: new Date(),
      },
    });

    return {
      ok: true,
      paid: false,
      bookingId: booking.id,
      message: "Payment was not completed.",
    };
  }

  const finalOrderId = orderId ?? booking.mpgsOrderId;
  if (!finalOrderId) {
    return {
      ok: false,
      paid: false,
      bookingId: booking.id,
      message: "Payment order is missing.",
    };
  }

  const order = rawOrder ?? (await retrieveMpgsOrder(finalOrderId));
  const summary = getMpgsOrderSummary(order);
  const now = new Date();

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      mpgsOrderId: finalOrderId,
      mpgsResultIndicator: resultIndicator,
      mpgsTransactionId: summary.transactionId,
      mpgsOrderStatus: summary.orderStatus,
      mpgsResult: summary.result,
      paymentRaw: order as Prisma.InputJsonValue,
      bookingStatus: summary.isPaid ? "CONFIRMED" : "PAYMENT_FAILED",
      paymentStatus: summary.isPaid ? "PAID" : "FAILED",
      paidAt: summary.isPaid ? booking.paidAt ?? now : booking.paidAt,
      paymentFailedAt: summary.isPaid ? booking.paymentFailedAt : now,
    },
  });

  if (summary.isPaid) {
    await sendBookingInvoiceEmail(booking.id).catch((error) => {
      console.error("Failed to send booking invoice email:", error);
    });
  }

  return {
    ok: true,
    paid: summary.isPaid,
    bookingId: booking.id,
    message: summary.isPaid
      ? "Payment confirmed. Your booking is complete."
      : "Payment was not completed.",
  };
}
