import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Payment } from "@/models/payment.model";
import { ok, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return forbidden();

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status") ?? "";
  const page    = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit   = 20;
  const skip    = (page - 1) * limit;
  const search  = searchParams.get("q") ?? "";

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { orderNumber:      { $regex: search, $options: "i" } },
      { paymentRef:       { $regex: search, $options: "i" } },
      { gatewayPaymentId: { $regex: search, $options: "i" } },
      { gatewayOrderId:   { $regex: search, $options: "i" } },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .select("-webhookPayload -gatewayResponse -attempts -logs")
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return ok({ payments, total, page, pages: Math.ceil(total / limit) });
}
