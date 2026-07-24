import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/models/order.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const CANCELLABLE_STATUSES = ["pending", "confirmed", "packed"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user)
    return NextResponse.json({ error: "Please sign in to cancel an order." }, { status: 401 });

  const { id } = await params;
  await connectDB();

  // Single atomic operation: find by ownership + cancellable status, update in one query
  const order = await Order.findOneAndUpdate(
    { _id: id, userId: session.user._id, status: { $in: CANCELLABLE_STATUSES } },
    {
      $set: { status: "cancelled" },
      $push: {
        timeline: {
          status: "cancelled",
          timestamp: new Date(),
          message: "Cancelled by user.",
        },
      },
    },
    { new: true }
  );

  if (!order)
    return NextResponse.json({ error: "Order not found or cannot be cancelled." }, { status: 404 });

  return NextResponse.json({ success: true });
}
