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

  const brevoKey = process.env.BREVO_SMTP_KEY;
  const brevoUser = process.env.BREVO_SMTP_USER;

  if (brevoKey && brevoUser) {
    // Brevo SMTP relay — works from any cloud provider (Vercel/AWS/etc.)
    _transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
      pool: true,
      maxConnections: 5,
    });
  } else {
    // Gmail SMTP — only works locally (Google blocks cloud provider IPs)
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 5,
    });
  }

  return _transporter;
}

export async function sendEmail({ to, subject, html, text }: MailOptions): Promise<void> {
  const brevoKey = process.env.BREVO_SMTP_KEY;
  const brevoUser = process.env.BREVO_SMTP_USER;
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;

  const hasBrevo = !!(brevoKey && brevoUser);
  const hasGmail = !!(gmailUser && gmailPass);

  if (!hasBrevo && !hasGmail) {
    console.error(
      "[Email] No email credentials configured. Set EMAIL_USER/EMAIL_PASS (Gmail) or BREVO_SMTP_USER/BREVO_SMTP_KEY in your environment. Intended recipient:",
      to
    );
    throw new Error("Email service is not configured");
  }

  const from = process.env.EMAIL_FROM ?? `SunEra Lifestyle <${brevoUser ?? gmailUser}>`;
  const domain = (brevoUser ?? gmailUser)?.split("@")[1] ?? "gmail.com";
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
        "Message-ID": msgId,
        "Precedence": "transactional",
        "X-Mailer": "SunEra Lifestyle Transactional Mailer",
      },
    });
    console.warn("[Email] Sent via", hasBrevo ? "Brevo" : "Gmail", "— messageId:", info.messageId, "to:", to);
  } catch (err) {
    console.error("[Email] SMTP error:", err);
    throw err;
  }
}
