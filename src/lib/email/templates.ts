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

// ─── Order confirmation ───────────────────────────────────────────────────────

interface OrderItem { name: string; image: string; quantity: number; price: number }

export function orderConfirmationTemplate(opts: {
  name: string;
  orderNumber: string;
  orderDate: string;
  estimatedDelivery: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  couponDiscount?: number;
  couponCode?: string;
  total: number;
  shippingAddress: { name: string; addressLine1: string; city: string; state: string; pincode: string };
  paymentMethod: string;
  trackUrl: string;
}): string {
  const {
    name, orderNumber, orderDate, estimatedDelivery,
    items, subtotal, shippingFee, couponDiscount, couponCode,
    total, shippingAddress, paymentMethod, trackUrl,
  } = opts;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:56px;vertical-align:top;">
              ${item.image
                ? `<img src="${item.image}" width="48" height="48" style="border-radius:8px;object-fit:cover;display:block;" />`
                : `<div style="width:48px;height:48px;background:#f3f4f6;border-radius:8px;"></div>`}
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#0a0a0a;line-height:1.4;">${item.name}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Qty: ${item.quantity}</p>
            </td>
            <td style="vertical-align:top;text-align:right;white-space:nowrap;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#0a0a0a;">₹${(item.price * item.quantity).toLocaleString("en-IN")}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  const priceRow = (label: string, value: string, accent = false) =>
    `<tr>
      <td style="padding:4px 0;font-size:13px;color:#6b7280;">${label}</td>
      <td style="padding:4px 0;font-size:13px;font-weight:600;text-align:right;color:${accent ? "#1a5c14" : "#0a0a0a"};">${value}</td>
    </tr>`;

  const stepDone  = (n: number, label: string) =>
    `<td align="center" style="width:20%;">
      <div style="width:32px;height:32px;background:#1a5c14;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;">${n}</div>
      <p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#1a5c14;">${label}</p>
    </td>`;
  const stepPending = (n: number, label: string) =>
    `<td align="center" style="width:20%;">
      <div style="width:32px;height:32px;background:#e5e7eb;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;font-weight:700;">${n}</div>
      <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">${label}</p>
    </td>`;

  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Order Confirmed! 🎉</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, your payment was received and your order is being processed. Here's your summary.
    </p>

    <!-- Order meta -->
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order Number</td>
          <td style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Date</td>
        </tr>
        <tr>
          <td style="font-size:16px;font-weight:800;color:#0a0a0a;font-family:monospace;">${orderNumber}</td>
          <td style="font-size:14px;font-weight:600;color:#0a0a0a;text-align:right;">${orderDate}</td>
        </tr>
      </table>
    </div>

    <!-- Estimated delivery -->
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Estimated Delivery</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#14532d;">${estimatedDelivery}</p>
    </div>

    <!-- Tracking steps -->
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Order Progress</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${stepDone(1, "Placed")}
          ${stepDone(2, "Confirmed")}
          ${stepPending(3, "Packed")}
          ${stepPending(4, "Shipped")}
          ${stepPending(5, "Delivered")}
        </tr>
      </table>
    </div>

    <!-- Items -->
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Items Ordered</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemRows}
    </table>

    <!-- Price breakdown -->
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${priceRow("Subtotal", `₹${subtotal.toLocaleString("en-IN")}`)}
        ${shippingFee > 0 ? priceRow("Shipping", `₹${shippingFee.toLocaleString("en-IN")}`) : priceRow("Shipping", "FREE")}
        ${couponDiscount && couponDiscount > 0 ? priceRow(`Coupon (${couponCode ?? ""})`, `−₹${couponDiscount.toLocaleString("en-IN")}`, true) : ""}
        <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:8px;"></td></tr>
        <tr>
          <td style="padding:4px 0;font-size:15px;font-weight:800;color:#0a0a0a;">Total Paid</td>
          <td style="padding:4px 0;font-size:15px;font-weight:800;text-align:right;color:#1a5c14;">₹${total.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:8px;font-size:12px;color:#6b7280;">
            Payment via ${paymentMethod === "razorpay" ? "Razorpay (Online)" : "Cash on Delivery"}
          </td>
        </tr>
      </table>
    </div>

    <!-- Shipping address -->
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Delivery Address</p>
      <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7;">
        ${shippingAddress.name}<br/>
        ${shippingAddress.addressLine1}<br/>
        ${shippingAddress.city}, ${shippingAddress.state} – ${shippingAddress.pincode}
      </p>
    </div>

    <div style="text-align:center;">${btn(trackUrl, "Track My Order")}</div>
    ${note("Need help? WhatsApp us at <strong>+91 91355 64607</strong> or reply to this email.")}
  `);
}

// ─── Order status update ──────────────────────────────────────────────────────

export function orderStatusTemplate(opts: {
  name: string;
  orderNumber: string;
  status: string;
  message: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackUrl: string;
}): string {
  const { name, orderNumber, status, message, estimatedDelivery, trackingNumber, trackUrl } = opts;

  const STATUS_ICON: Record<string, string> = {
    confirmed: "✅", packed: "📦", shipped: "🚚", delivered: "🎉", cancelled: "❌",
  };
  const icon = STATUS_ICON[status.toLowerCase()] ?? "📋";

  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">${icon} Order ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, ${message}
    </p>

    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#0a0a0a;font-family:monospace;">${orderNumber}</p>
      ${estimatedDelivery ? `<p style="margin:8px 0 0;font-size:13px;color:#1a5c14;font-weight:600;">Expected by: ${estimatedDelivery}</p>` : ""}
      ${trackingNumber ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Tracking: <strong>${trackingNumber}</strong></p>` : ""}
    </div>

    <div style="text-align:center;">${btn(trackUrl, "Track Order")}</div>
    ${note("Questions? WhatsApp us at <strong>+91 91355 64607</strong>.")}
  `);
}

// ─── Return & Refund emails ───────────────────────────────────────────────────

interface ReturnItem { name: string; quantity: number }

function returnItemRows(items: ReturnItem[]) {
  return items.map((i) => `<li style="padding:4px 0;font-size:14px;color:#4b5563;">${i.name} × ${i.quantity}</li>`).join("");
}

export function returnSubmittedTemplate(opts: {
  returnNumber: string;
  orderNumber:  string;
  items:        ReturnItem[];
  reason:       string;
}): string {
  const { returnNumber, orderNumber, items, reason } = opts;
  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Return Request Received 📦</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      We have received your return request. Our team will review it and get back to you shortly.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Return ID</td>
          <td style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Order</td>
        </tr>
        <tr>
          <td style="font-size:16px;font-weight:800;color:#0a0a0a;font-family:monospace;">${returnNumber}</td>
          <td style="font-size:14px;font-weight:700;color:#0a0a0a;text-align:right;font-family:monospace;">${orderNumber}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Items</p>
    <ul style="margin:0 0 16px;padding-left:20px;">${returnItemRows(items)}</ul>
    <p style="margin:0 0 24px;font-size:14px;color:#4b5563;">
      <strong>Reason:</strong> ${reason.charAt(0).toUpperCase() + reason.slice(1)}
    </p>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">What happens next?</p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.6;">
        Our team will review your request within 1–2 business days and notify you of the decision.
      </p>
    </div>
    ${note("Questions? WhatsApp us at <strong>+91 91355 64607</strong>.")}
  `);
}

export function returnApprovedTemplate(opts: {
  returnNumber: string;
  orderNumber:  string;
  items:        ReturnItem[];
  adminNote?:   string;
  trackUrl:     string;
}): string {
  const { returnNumber, orderNumber, items, adminNote, trackUrl } = opts;
  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Return Approved ✅</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Great news! Your return request has been approved. We will process your refund shortly.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Return ID</p>
      <p style="margin:4px 0 8px;font-size:16px;font-weight:800;color:#0a0a0a;font-family:monospace;">${returnNumber}</p>
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#0a0a0a;font-family:monospace;">${orderNumber}</p>
    </div>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Items</p>
    <ul style="margin:0 0 16px;padding-left:20px;">${returnItemRows(items)}</ul>
    ${adminNote ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;"><p style="margin:0;font-size:13px;color:#15803d;"><strong>Admin Note:</strong> ${adminNote}</p></div>` : ""}
    <div style="text-align:center;">${btn(trackUrl, "Track Return")}</div>
    ${note("Questions? WhatsApp us at <strong>+91 91355 64607</strong>.")}
  `);
}

export function returnRejectedTemplate(opts: {
  returnNumber:    string;
  orderNumber:     string;
  items:           ReturnItem[];
  rejectionReason: string;
  trackUrl:        string;
}): string {
  const { returnNumber, orderNumber, items, rejectionReason, trackUrl } = opts;
  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Return Request Rejected ❌</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      We're sorry, but we are unable to process your return request at this time.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Return ID</p>
      <p style="margin:4px 0 8px;font-size:16px;font-weight:800;color:#0a0a0a;font-family:monospace;">${returnNumber}</p>
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#0a0a0a;font-family:monospace;">${orderNumber}</p>
    </div>
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Items</p>
    <ul style="margin:0 0 16px;padding-left:20px;">${returnItemRows(items)}</ul>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#991b1b;">Reason for Rejection</p>
      <p style="margin:6px 0 0;font-size:14px;color:#7f1d1d;line-height:1.6;">${rejectionReason}</p>
    </div>
    <div style="text-align:center;">${btn(trackUrl, "View Details")}</div>
    ${note("If you believe this is incorrect, WhatsApp us at <strong>+91 91355 64607</strong>.")}
  `);
}

export function refundProcessingTemplate(opts: {
  returnNumber:  string;
  orderNumber:   string;
  refundAmount:  number;
  paymentMethod: string;
  trackUrl:      string;
}): string {
  const { returnNumber, orderNumber, refundAmount, paymentMethod, trackUrl } = opts;
  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Refund In Progress 🔄</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Your refund is being processed. It will reflect in your account within 5–7 business days.
    </p>
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Refund Amount</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#14532d;">₹${refundAmount.toLocaleString("en-IN")}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#15803d;">via ${paymentMethod}</p>
    </div>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Return ID</p>
      <p style="margin:4px 0 8px;font-size:16px;font-weight:800;color:#0a0a0a;font-family:monospace;">${returnNumber}</p>
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#0a0a0a;font-family:monospace;">${orderNumber}</p>
    </div>
    <div style="text-align:center;">${btn(trackUrl, "Track Return")}</div>
  `);
}

export function refundCompletedTemplate(opts: {
  returnNumber:  string;
  orderNumber:   string;
  refundAmount:  number;
  refundId:      string;
  paymentMethod: string;
  refundDate:    string;
  trackUrl:      string;
}): string {
  const { returnNumber, orderNumber, refundAmount, refundId, paymentMethod, refundDate, trackUrl } = opts;
  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Refund Completed 🎉</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Your refund has been successfully processed. The amount should reflect in your account shortly.
    </p>
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Amount Refunded</p>
      <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#14532d;">₹${refundAmount.toLocaleString("en-IN")}</p>
    </div>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:12px;color:#6b7280;padding:4px 0;">Return ID</td><td style="text-align:right;font-size:13px;font-weight:700;font-family:monospace;">${returnNumber}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;padding:4px 0;">Order</td><td style="text-align:right;font-size:13px;font-weight:700;font-family:monospace;">${orderNumber}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;padding:4px 0;">Refund ID</td><td style="text-align:right;font-size:13px;font-weight:700;font-family:monospace;">${refundId}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;padding:4px 0;">Method</td><td style="text-align:right;font-size:13px;font-weight:600;">${paymentMethod}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;padding:4px 0;">Date</td><td style="text-align:right;font-size:13px;font-weight:600;">${refundDate}</td></tr>
      </table>
    </div>
    <div style="text-align:center;">${btn(trackUrl, "View Return Details")}</div>
    ${note("Thank you for shopping with SunEra Lifestyle!")}
  `);
}

export function refundFailedTemplate(opts: {
  returnNumber:  string;
  orderNumber:   string;
  failureReason: string;
}): string {
  const { returnNumber, orderNumber, failureReason } = opts;
  return wrapper(`
    <h2 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0a0a0a;">Refund Failed ⚠️</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      We encountered an issue processing your refund. Our team will retry or contact you shortly.
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Return ID</p>
      <p style="margin:4px 0 8px;font-size:16px;font-weight:800;color:#0a0a0a;font-family:monospace;">${returnNumber}</p>
      <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#0a0a0a;font-family:monospace;">${orderNumber}</p>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#991b1b;">Failure Reason</p>
      <p style="margin:6px 0 0;font-size:14px;color:#7f1d1d;line-height:1.6;">${failureReason}</p>
    </div>
    ${note("Please WhatsApp us at <strong>+91 91355 64607</strong> and we'll resolve this immediately.")}
  `);
}

export function welcomeTemplate(name: string): string {
  return wrapper(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0a0a0a;">Welcome to SunEra! 🎉</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, your account is verified and ready. Welcome to the SunEra Lifestyle family!
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
