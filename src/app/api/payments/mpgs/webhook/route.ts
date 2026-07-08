import { NextResponse } from "next/server";
import { confirmBookingPayment } from "@/lib/payments/booking-payment";
import {
  getOrderIdFromMpgsPayload,
  retrieveMpgsOrder,
  verifyMpgsWebhookRequest,
} from "@/lib/payments/mpgs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!process.env.MPGS_WEBHOOK_SECRET) {
    console.error("MPGS webhook secret is not configured.");
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 503 }
    );
  }

  if (!verifyMpgsWebhookRequest(request.headers, rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = getOrderIdFromMpgsPayload(payload);
  if (!orderId) {
    return NextResponse.json(
      { error: "Missing order id" },
      { status: 400 }
    );
  }

  try {
    const order = await retrieveMpgsOrder(orderId);
    const result = await confirmBookingPayment({
      orderId,
      rawOrder: order,
    });

    return NextResponse.json({
      received: true,
      paid: result.paid,
      bookingId: result.bookingId,
    });
  } catch (error) {
    console.error("Failed to process MPGS webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
