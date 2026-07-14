type SendEmailInput = {
  to: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
};

type ResendErrorBody = {
  message?: string;
  name?: string;
};

export async function sendEmail({
  to,
  bcc,
  subject,
  html,
  text,
  attachments,
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("INVOICE_FROM_EMAIL is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      ...(bcc?.length ? { bcc } : {}),
      subject,
      html,
      text,
      ...(attachments?.length ? { attachments } : {}),
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ResendErrorBody | null;
    throw new Error(body?.message ?? body?.name ?? "Failed to send email with Resend.");
  }
}
