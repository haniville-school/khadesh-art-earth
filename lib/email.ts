const RESEND_URL = "https://api.resend.com/emails";

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends an email through Resend's HTTP API. Never throws: a failed
 * email must not break the order, approval or shipment that triggered it.
 * Returns true only if Resend accepted the message.
 *
 * - No RESEND_API_KEY      -> skipped and logged
 * - No EMAIL_FROM          -> uses Resend's test sender, which can only
 *                             deliver to your own Resend account email
 * - EMAIL_FROM on your own verified domain -> real delivery to anyone
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Khadesh Art <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email skipped - RESEND_API_KEY not set] subject="${subject}"`);
    return false;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
      }),
    });

    if (!res.ok) {
      console.error("Resend rejected email:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}