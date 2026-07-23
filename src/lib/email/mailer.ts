import nodemailer from "nodemailer";
import crypto from "crypto";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,          // keep connection alive across emails
    maxConnections: 5,
  });
  return _transporter;
}

export async function sendEmail({ to, subject, html, text }: MailOptions): Promise<void> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set — skipping send to:", to);
    return;
  }

  const from = process.env.EMAIL_FROM ?? `SunEra Lifestyle <${user}>`;
  const domain = process.env.EMAIL_USER?.split("@")[1] ?? "gmail.com";
  const msgId = `<${crypto.randomUUID()}@${domain}>`;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      headers: {
        // Unique per message — prevents Gmail threading duplicate-looking emails
        "Message-ID": msgId,
        // Signals this is a one-to-one transactional mail, not bulk
        "Precedence": "transactional",
        // Required by Gmail & Yahoo bulk sender rules (reduces spam scoring)
        "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL ?? "https://sunera-lifestyle.vercel.app"}/unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        // Helps identify the sending application
        "X-Mailer": "SunEra Lifestyle Transactional Mailer",
      },
    });
    console.warn("[Email] Sent — messageId:", info.messageId, "to:", to);
  } catch (err) {
    console.error("[Email] SMTP error:", err);
    throw err;
  }
}
