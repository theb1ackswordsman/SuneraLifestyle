import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { Order } from "@/models/order.model";
import { ok, forbidden, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id)
      .select("name email phone avatar isEmailVerified isActive createdAt lastLoginAt addresses")
      .lean();

    if (!user) return notFound("Customer not found.");

    const orders = await Order.find({ userId: id })
      .select("orderNumber status paymentStatus total subtotal shippingFee couponDiscount items createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    const summary = {
      totalOrders:    orders.length,
      totalSpent,
      cancelled:      orders.filter((o) => o.status === "cancelled").length,
      refunded:       orders.filter((o) => o.status === "refunded" || o.paymentStatus === "refunded").length,
      delivered:      orders.filter((o) => o.status === "delivered").length,
    };

    return ok({ user, orders, summary });
  } catch (err) {
    return handleApiError(err);
  }
}
