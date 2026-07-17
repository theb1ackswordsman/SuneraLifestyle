import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/models/order.model";
import { ok, forbidden, notFound, badRequest, handleApiError } from "@/lib/api/response";
import { ORDER_STATUS } from "@/constants";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id)
      .populate("userId", "name email phone")
      .lean();
    if (!order) return notFound("Order not found.");
    return ok({ order });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    const { status } = await req.json() as { status: string };

    if (!Object.values(ORDER_STATUS).includes(status as never)) {
      return badRequest("Invalid order status.");
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: { timeline: { status, timestamp: new Date(), message: `Status updated to ${status} by admin.` } },
      },
      { new: true }
    );

    if (!order) return notFound("Order not found.");
    return ok({ order }, "Order status updated.");
  } catch (err) {
    return handleApiError(err);
  }
}
