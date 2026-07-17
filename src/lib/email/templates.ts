const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sunera.in";

const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SunEra Lifestyle</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#071f04,#1a5c14);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              Sun<span style="color:#f5a823;">Era</span>
            </span>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Elevate Your Performance</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #f0f0f0;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} SunEra Lifestyle. All rights reserved.<br/>
              <a href="${BASE_URL}/unsubscribe" style="color:#1a5c14;text-decoration:none;">Unsubscribe</a>
              &nbsp;·&nbsp;
              <a href="${BASE_URL}/privacy-policy" style="color:#1a5c14;text-decoration:none;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#1a5c14;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;margin:24px 0;">${label}</a>`;

const note = (text: string) =>
  `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">${text}</p>`;

export function verifyEmailTemplate(name: string, token: string): string {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  return wrapper(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0a0a0a;">Verify Your Email</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, welcome to SunEra Lifestyle! Please verify your email address to activate your account.
    </p>
    <div style="text-align:center;">${btn(link, "Verify Email Address")}</div>
    ${note("This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.")}
    <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:12px;word-break:break-all;">
      <p style="margin:0;font-size:12px;color:#6b7280;">Or copy this link:<br/>
        <span style="color:#1a5c14;font-family:monospace;font-size:11px;">${link}</span>
      </p>
    </div>
  `);
}

export function resetPasswordTemplate(name: string, token: string): string {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  return wrapper(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0a0a0a;">Reset Your Password</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, we received a request to reset your password. Click the button below to choose a new one.
    </p>
    <div style="text-align:center;">${btn(link, "Reset Password")}</div>
    ${note("This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your password will remain unchanged.")}
  `);
}

export function welcomeTemplate(name: string): string {
  return wrapper(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0a0a0a;">Welcome to SunEra! 🎉</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, your account is verified and ready. Use code <strong style="color:#1a5c14;font-family:monospace;background:#f0fdf4;padding:2px 6px;border-radius:4px;">WELCOME15</strong> for 15% off your first order.
    </p>
    <div style="text-align:center;">${btn(`${BASE_URL}/shop`, "Start Shopping")}</div>
    <div style="margin-top:32px;display:flex;gap:16px;">
      ${[
        ["💪", "Premium Protein", "Formulated for peak performance"],
        ["👕", "Fitness Clothing", "Style meets strength"],
        ["🏆", "100% Authentic", "Lab-certified quality"],
      ]
        .map(
          ([emoji, title, sub]) =>
            `<div style="flex:1;padding:16px;background:#f9fafb;border-radius:12px;text-align:center;">
              <div style="font-size:24px;">${emoji}</div>
              <p style="margin:8px 0 4px;font-size:13px;font-weight:700;color:#0a0a0a;">${title}</p>
              <p style="margin:0;font-size:12px;color:#6b7280;">${sub}</p>
            </div>`
        )
        .join("")}
    </div>
  `);
}
