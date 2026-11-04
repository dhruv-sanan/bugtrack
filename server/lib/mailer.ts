import nodemailer from "nodemailer";
import { env } from "../env";

interface AssignmentEmail {
  to: string;
  ticketKey: string;
  ticketId: number;
  ticketTitle: string;
  projectName: string;
  assignedByName: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildAssignmentEmail(email: AssignmentEmail, appUrl: string) {
  const url = `${appUrl}/tickets/${email.ticketId}`;
  const summary = `${email.assignedByName} assigned ${email.ticketKey} to you in ${email.projectName}.`;
  return {
    subject: `[${email.ticketKey}] Assigned to you: ${email.ticketTitle}`,
    text: `${summary}\n\n${email.ticketTitle}\n${url}`,
    html: `<p>${escapeHtml(summary)}</p><p><strong>${escapeHtml(email.ticketTitle)}</strong></p><p><a href="${escapeHtml(url)}">Open ticket</a></p>`,
  };
}

/**
 * Must be awaited: Vercel may stop the function once the response is sent.
 * Never throws, because a mail outage should not fail the ticket update.
 */
export async function sendAssignmentEmail(email: AssignmentEmail): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, APP_URL } = env();

  // example.com is reserved and never delivers, so demo accounts skip sending.
  if (email.to.endsWith("@example.com")) return;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP is not configured, skipping assignment email");
    return;
  }

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 5_000,
    });
    await transport.sendMail({
      from: MAIL_FROM ?? SMTP_USER,
      to: email.to,
      ...buildAssignmentEmail(email, APP_URL),
    });
  } catch (err) {
    console.error("Failed to send assignment email:", err);
  }
}
