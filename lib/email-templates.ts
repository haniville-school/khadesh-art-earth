export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://khadesh-art-earth.vercel.app";

export type EmailRow = { label: string; value: string; strong?: boolean };

export type EmailContent = {
  subject: string;
  heading: string;
  paragraphs: string[];
  rows?: EmailRow[];
  cta?: { label: string; url: string };
};

// Product titles, store names and notes are typed by vendors, so
// everything dynamic is escaped before it goes into HTML.
export function esc(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function money(amount: unknown): string {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export function render(content: EmailContent) {
  const rowsHtml = content.rows?.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin:20px 0;">${content.rows
        .map((r) => {
          const weight = r.strong ? "font-weight:600;" : "";
          return `<tr><td style="padding:8px 0;border-bottom:1px solid #d9d2c3;${weight}">${esc(
            r.label
          )}</td><td style="padding:8px 0;border-bottom:1px solid #d9d2c3;text-align:right;${weight}">${esc(
            r.value
          )}</td></tr>`;
        })
        .join("")}</table>`
    : "";

  const ctaHtml = content.cta
    ? `<p style="margin:24px 0;"><a href="${esc(
        content.cta.url
      )}" style="background:#3f4a3a;color:#ffffff;padding:12px 20px;text-decoration:none;display:inline-block;">${esc(
        content.cta.label
      )}</a></p>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ede8de;">
    <div style="padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#2b2a25;">
      <div style="max-width:560px;margin:0 auto;background:#f7f4ec;padding:32px;">
        <p style="font-family:Georgia,serif;font-style:italic;font-size:22px;margin:0 0 24px;">Khadesh Art</p>
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 16px;">${esc(
          content.heading
        )}</h1>
        ${content.paragraphs
          .map((p) => `<p style="line-height:1.6;margin:0 0 12px;">${esc(p)}</p>`)
          .join("")}
        ${rowsHtml}
        ${ctaHtml}
        <p style="font-size:12px;color:#7a7870;margin:32px 0 0;">You're receiving this because of activity on your Khadesh Art account.</p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    content.heading,
    "",
    ...content.paragraphs,
    ...(content.rows?.length ? ["", ...content.rows.map((r) => `${r.label}: ${r.value}`)] : []),
    ...(content.cta ? ["", `${content.cta.label}: ${content.cta.url}`] : []),
    "",
    "- Khadesh Art",
  ].join("\n");

  return { subject: content.subject, html, text };
}