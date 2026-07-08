import crypto from "crypto";

export type MpgsInitiateCheckoutInput = {
  orderId: string;
  amount: number;
  currency: "USD";
  description: string;
  returnUrl: string;
  cancelUrl: string;
  notificationUrl: string;
  customerEmail: string;
  merchantName?: string;
};

type MpgsConfig = {
  baseUrl: string;
  apiVersion: string;
  merchantId: string;
  apiUsername: string;
  apiPassword: string;
  webhookSecret?: string;
};

export type MpgsInitiateCheckoutResult = {
  sessionId: string;
  successIndicator?: string;
  raw: unknown;
};

type MpgsErrorBody = {
  error?: {
    cause?: string;
    explanation?: string;
    supportCode?: string;
  };
  result?: string;
};

export function getMpgsConfig(): MpgsConfig {
  const baseUrl =
    process.env.MPGS_BASE_URL ?? "https://banquemisr.gateway.mastercard.com";
  const apiVersion = process.env.MPGS_API_VERSION ?? "100";
  const merchantId = process.env.MPGS_MERCHANT_ID;
  const apiUsername =
    process.env.MPGS_API_USERNAME ??
    (merchantId ? `merchant.${merchantId}` : undefined);
  const apiPassword = process.env.MPGS_API_PASSWORD;

  if (!merchantId || !apiUsername || !apiPassword) {
    throw new Error(
      "MPGS is not configured. Set MPGS_MERCHANT_ID, MPGS_API_USERNAME, and MPGS_API_PASSWORD."
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiVersion,
    merchantId,
    apiUsername,
    apiPassword,
    webhookSecret: process.env.MPGS_WEBHOOK_SECRET,
  };
}

export function getMpgsCheckoutScriptUrl() {
  const baseUrl =
    process.env.MPGS_BASE_URL ?? "https://banquemisr.gateway.mastercard.com";
  return `${baseUrl.replace(/\/$/, "")}/static/checkout/checkout.min.js`;
}

export async function initiateMpgsCheckout(
  input: MpgsInitiateCheckoutInput
): Promise<MpgsInitiateCheckoutResult> {
  const config = getMpgsConfig();
  const response = await mpgsFetch(config, "/session", {
    method: "POST",
    body: JSON.stringify({
      apiOperation: "INITIATE_CHECKOUT",
      checkoutMode: "WEBSITE",
      interaction: {
        operation: "PURCHASE",
        merchant: {
          name: input.merchantName ?? "ANM Tours",
        },
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
      },
      order: {
        id: input.orderId,
        amount: formatAmount(input.amount),
        currency: input.currency,
        description: input.description,
        notificationUrl: input.notificationUrl,
      },
      customer: {
        email: input.customerEmail,
      },
    }),
  });

  const body = (await response.json()) as {
    session?: { id?: string };
    successIndicator?: string;
  };

  if (!response.ok || !body.session?.id) {
    throw new Error(getMpgsErrorMessage(body as MpgsErrorBody));
  }

  return {
    sessionId: body.session.id,
    successIndicator: body.successIndicator,
    raw: body,
  };
}

export async function retrieveMpgsOrder(orderId: string): Promise<unknown> {
  const config = getMpgsConfig();
  const response = await mpgsFetch(
    config,
    `/order/${encodeURIComponent(orderId)}`,
    { method: "GET" }
  );
  const body = await response.json();

  if (!response.ok) {
    throw new Error(getMpgsErrorMessage(body as MpgsErrorBody));
  }

  return body;
}

export function getMpgsOrderSummary(order: unknown) {
  const data = asRecord(order);
  const orderRecord = asRecord(data.order);
  const transaction = getLatestTransaction(data.transaction);
  const transactionRecord = asRecord(transaction);

  const result = stringValue(data.result) ?? stringValue(transactionRecord.result);
  const orderStatus = stringValue(orderRecord.status) ?? stringValue(data.status);
  const transactionId = stringValue(transactionRecord.id);

  return {
    result,
    orderStatus,
    transactionId,
    isPaid: isSuccessfulPayment(result, orderStatus),
  };
}

export function verifyMpgsWebhookRequest(
  headers: Headers,
  rawBody: string
): boolean {
  const secret = process.env.MPGS_WEBHOOK_SECRET;
  if (!secret) return false;

  const directSecret =
    headers.get("x-notification-secret") ??
    headers.get("x-mpgs-notification-secret") ??
    headers.get("x-webhook-secret");
  if (safeEqual(directSecret, secret)) return true;

  const authorization = headers.get("authorization");
  if (authorization) {
    if (authorization.toLowerCase().startsWith("basic ")) {
      const encoded = authorization.slice(6).trim();
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const password = decoded.includes(":")
        ? decoded.slice(decoded.indexOf(":") + 1)
        : decoded;
      if (safeEqual(password, secret)) return true;
    }

    if (authorization.toLowerCase().startsWith("bearer ")) {
      if (safeEqual(authorization.slice(7).trim(), secret)) return true;
    }
  }

  const signature =
    headers.get("x-notification-signature") ??
    headers.get("x-mpgs-signature") ??
    headers.get("x-signature");
  if (signature) {
    const hexDigest = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const base64Digest = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    if (safeEqual(signature, hexDigest) || safeEqual(signature, base64Digest)) {
      return true;
    }
  }

  return false;
}

export function getOrderIdFromMpgsPayload(payload: unknown): string | null {
  const data = asRecord(payload);
  const order = asRecord(data.order);
  return stringValue(order.id) ?? stringValue(data.orderId) ?? null;
}

async function mpgsFetch(
  config: MpgsConfig,
  path: string,
  init: RequestInit
) {
  const auth = Buffer.from(
    `${config.apiUsername}:${config.apiPassword}`,
    "utf8"
  ).toString("base64");

  return fetch(
    `${config.baseUrl}/api/rest/version/${config.apiVersion}/merchant/${encodeURIComponent(
      config.merchantId
    )}${path}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    }
  );
}

function formatAmount(amount: number) {
  return amount.toFixed(2);
}

function getMpgsErrorMessage(body: MpgsErrorBody) {
  const explanation = body.error?.explanation;
  const cause = body.error?.cause;
  const supportCode = body.error?.supportCode;
  return [explanation, cause, supportCode ? `Support code: ${supportCode}` : ""]
    .filter(Boolean)
    .join(" - ") || "MPGS payment request failed";
}

function getLatestTransaction(transaction: unknown) {
  if (Array.isArray(transaction)) return transaction.at(-1);
  return transaction;
}

function isSuccessfulPayment(result?: string, orderStatus?: string) {
  const normalizedResult = result?.toUpperCase();
  const normalizedStatus = orderStatus?.toUpperCase();

  return (
    normalizedResult === "SUCCESS" ||
    normalizedStatus === "CAPTURED" ||
    normalizedStatus === "PAID" ||
    normalizedStatus === "PAYMENT_SUCCESS" ||
    normalizedStatus === "SUCCESS"
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function safeEqual(a: string | null | undefined, b: string) {
  if (!a) return false;
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return (
    aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer)
  );
}
