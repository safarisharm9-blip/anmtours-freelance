import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getMpgsCheckoutScriptUrl,
  initiateMpgsCheckout,
} from "@/lib/payments/mpgs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true, role: true },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User not found or email required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { date, adults, children, serviceId, locale = "en" } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    const adultsNum = typeof adults === "number" ? adults : parseInt(String(adults), 10);
    const childrenNum = typeof children === "number" ? children : parseInt(String(children), 10);

    if (
      isNaN(adultsNum) ||
      adultsNum < 0 ||
      isNaN(childrenNum) ||
      childrenNum < 0 ||
      adultsNum + childrenNum < 1
    ) {
      return NextResponse.json(
        { error: "Please select at least one traveler" },
        { status: 400 }
      );
    }

    if (!serviceId || typeof serviceId !== "string") {
      return NextResponse.json(
        { error: "Service is required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
      select: {
        id: true,
        details: true,
        priceAdult: true,
        priceKids: true,
        slug: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const totalNum = roundCurrency(
      adultsNum * service.priceAdult + childrenNum * service.priceKids
    );

    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { error: "Invalid booking total" },
        { status: 400 }
      );
    }

    const data: Parameters<typeof prisma.booking.create>[0]["data"] = {
      date: dateObj,
      adults: adultsNum,
      children: childrenNum,
      total: totalNum,
      currency: "USD",
      bookingStatus: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      paymentProvider: "MPGS",
      paymentAttemptedAt: new Date(),
      user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          imageUrl: user.imageUrl ?? undefined,
          role: user.role,
        },
      serviceId: service.id,
    };
    const booking = await prisma.booking.create({ data });

    const orderId = `ANM-${booking.id}`;
    const requestUrl = new URL(request.url);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      process.env.APP_URL?.replace(/\/$/, "") ??
      requestUrl.origin;
    const safeLocale = typeof locale === "string" ? locale : "en";
    const returnUrl = `${origin}/${safeLocale}/payment/return?bookingId=${booking.id}`;
    const cancelUrl = `${origin}/${safeLocale}/payment/cancel?bookingId=${booking.id}`;
    const notificationUrl = `${origin}/api/payments/mpgs/webhook`;
    const serviceTitle = getServiceTitle(service.details, safeLocale) ?? service.slug;

    try {
      const checkout = await initiateMpgsCheckout({
        orderId,
        amount: totalNum,
        currency: "USD",
        description: `ANM Tours booking: ${serviceTitle}`,
        returnUrl,
        cancelUrl,
        notificationUrl,
        customerEmail: user.email,
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          mpgsOrderId: orderId,
          mpgsSessionId: checkout.sessionId,
          mpgsSuccessIndicator: checkout.successIndicator,
          paymentRaw: checkout.raw as Prisma.InputJsonValue,
        },
      });

      return NextResponse.json({
        bookingId: booking.id,
        orderId,
        sessionId: checkout.sessionId,
        checkoutScriptUrl: getMpgsCheckoutScriptUrl(),
      });
    } catch (paymentError) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          mpgsOrderId: orderId,
          bookingStatus: "PAYMENT_FAILED",
          paymentStatus: "FAILED",
          paymentFailedAt: new Date(),
        },
      });

      console.error("Failed to start MPGS checkout:", paymentError);
      return NextResponse.json(
        {
          error:
            paymentError instanceof Error
              ? paymentError.message
              : "Failed to start payment",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getServiceTitle(details: unknown, locale: string) {
  const items = Array.isArray(details) ? details : [];
  const localized = items.find(
    (item: { lang?: string }) => item?.lang === locale
  ) as { title?: string } | undefined;
  const english = items.find(
    (item: { lang?: string }) => item?.lang === "en"
  ) as { title?: string } | undefined;
  const fallback = items[0] as { title?: string } | undefined;

  return localized?.title ?? english?.title ?? fallback?.title;
}
