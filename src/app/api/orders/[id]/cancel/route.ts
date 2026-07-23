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

  const order = await Order.findOne({ _id: id, userId: session.user._id });
  if (!order)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (!CANCELLABLE_STATUSES.includes(order.status))
    return NextResponse.json({ error: "This order cannot be cancelled as it has already been shipped or delivered." }, { status: 400 });

  await Order.findByIdAndUpdate(id, {
    $set: { status: "cancelled" },
    $push: {
      timeline: {
        status: "cancelled",
        timestamp: new Date(),
        message: "Cancelled by user.",
      },
    },
  });

  return NextResponse.json({ success: true });
}
