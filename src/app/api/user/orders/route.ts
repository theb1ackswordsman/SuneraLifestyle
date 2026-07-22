import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/models/order.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const orders = await Order.find({ userId: session.user._id, deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  const data = orders.map((o) => ({
    _id:              String(o._id),
    orderNumber:      o.orderNumber,
    status:           o.status,
    paymentStatus:    o.paymentStatus,
    paymentMethod:    o.paymentMethod,
    subtotal:         o.subtotal,
    shippingFee:      o.shippingFee,
    couponCode:       o.couponCode,
    couponDiscount:   o.couponDiscount ?? 0,
    total:            o.total,
    estimatedDelivery: o.estimatedDelivery?.toISOString() ?? null,
    trackingNumber:   o.trackingNumber ?? null,
    trackingUrl:      o.trackingUrl ?? null,
    createdAt:        (o.createdAt as Date).toISOString(),
    timeline: (o.timeline ?? []).map((t) => ({
      status:    t.status,
      message:   t.message ?? "",
      timestamp: (t.timestamp as Date).toISOString(),
    })),
    items: (o.items as Array<Record<string, unknown>>).map((i) => ({
      _id:      String(i._id ?? ""),
      name:     String(i.name ?? ""),
      image:    String(i.image ?? ""),
      slug:     String(i.slug ?? ""),
      price:    Number(i.price ?? 0),
      quantity: Number(i.quantity ?? 1),
    })),
    shippingAddress: (() => {
      const a = o.shippingAddress as Record<string, unknown>;
      return {
        name:         String(a.name ?? ""),
        phone:        String(a.phone ?? ""),
        addressLine1: String(a.addressLine1 ?? ""),
        addressLine2: String(a.addressLine2 ?? ""),
        city:         String(a.city ?? ""),
        state:        String(a.state ?? ""),
        pincode:      String(a.pincode ?? ""),
      };
    })(),
  }));

  return NextResponse.json({ data });
}
