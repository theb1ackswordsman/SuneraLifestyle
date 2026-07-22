import nodemailer from "nodemailer";

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
      pass: process.env.EMAIL_PASS, // Gmail App Password — NOT your Gmail login password
    },
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

  console.warn("[Email] Sending to:", to, "| subject:", subject, "| from:", from);

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ""),
    });
    console.warn("[Email] Sent OK — messageId:", info.messageId);
  } catch (err) {
    console.error("[Email] Gmail SMTP error:", err);
    throw err;
  }
}
