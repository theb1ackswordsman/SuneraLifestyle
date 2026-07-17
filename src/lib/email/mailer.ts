import nodemailer from "nodemailer";
import { env } from "@/config/env";

function createTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    // Dev: log to console
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: MailOptions): Promise<void> {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, ""),
  });

  if (process.env.NODE_ENV === "development") {
    console.warn("[Email dev]", { to, subject, messageId: info.messageId });
  }
}
