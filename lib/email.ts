import { logger } from "./logger";

/**
 * Transactional email via Resend's REST API (no SDK dependency).
 *
 * Dev / unconfigured fallback: when RESEND_API_KEY is unset we DON'T fail — we
 * log the message (including any action link) at warn level so the local flow
 * works end-to-end without an email provider. Set RESEND_API_KEY + EMAIL_FROM
 * in production to actually deliver mail.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

// Resend allows onboarding@resend.dev for testing without a verified domain.
const FROM = process.env.EMAIL_FROM || "SkillForge <onboarding@resend.dev>";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No provider configured — log so dev can follow the link from the console.
    logger.warn("[email] RESEND_API_KEY unset — not sending, logging instead", {
      to,
      subject,
      preview: text.slice(0, 500),
    });
    return { sent: false };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      logger.error("[email] Resend send failed", new Error(`HTTP ${res.status}: ${await res.text()}`), { to, subject });
      return { sent: false };
    }
    logger.info("[email] sent", { to, subject });
    return { sent: true };
  } catch (err) {
    logger.error("[email] Resend error", err instanceof Error ? err : new Error(String(err)), { to, subject });
    return { sent: false };
  }
}

// --- Templates ---------------------------------------------------------------

const BRAND = "SkillForge";

function layout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f0f;color:#e5e5e5;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#161616;border:1px solid rgba(255,255,255,.08);padding:32px">
      <div style="font-size:12px;letter-spacing:.25em;text-transform:uppercase;color:#facc15;font-weight:700;margin-bottom:24px">${BRAND}</div>
      <h1 style="font-size:20px;color:#fff;margin:0 0 16px">${heading}</h1>
      ${bodyHtml}
    </div>
  </div>`;
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#facc15;color:#0f0f0f;font-weight:700;font-size:12px;letter-spacing:.15em;text-transform:uppercase;text-decoration:none;padding:14px 24px;margin:8px 0">${label}</a>`;
}

export async function sendVerificationEmail(to: string, url: string): Promise<{ sent: boolean }> {
  return sendEmail({
    to,
    subject: `Verify your ${BRAND} email`,
    html: layout(
      "Verify your email",
      `<p style="color:#a3a3a3;line-height:1.6;font-size:14px">Confirm your email to activate your ${BRAND} account.</p>
       ${button(url, "Verify email")}
       <p style="color:#737373;font-size:12px;margin-top:16px">Or paste this link: <br>${url}</p>
       <p style="color:#737373;font-size:12px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>`
    ),
    text: `Verify your ${BRAND} email. Open this link (expires in 24h): ${url}`,
  });
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<{ sent: boolean }> {
  return sendEmail({
    to,
    subject: `Reset your ${BRAND} password`,
    html: layout(
      "Reset your password",
      `<p style="color:#a3a3a3;line-height:1.6;font-size:14px">We received a request to reset your ${BRAND} password.</p>
       ${button(url, "Reset password")}
       <p style="color:#737373;font-size:12px;margin-top:16px">Or paste this link: <br>${url}</p>
       <p style="color:#737373;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email — your password is unchanged.</p>`
    ),
    text: `Reset your ${BRAND} password. Open this link (expires in 1h): ${url}`,
  });
}
