import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function serializeAddresses(addresses: unknown[]) {
  return addresses.map((a: unknown) => {
    const addr = a as Record<string, unknown>;
    return {
      _id:       String(addr._id),
      label:     addr.label,
      name:      addr.name,
      phone:     addr.phone ?? "",
      line1:     addr.line1,
      line2:     addr.line2 ?? "",
      city:      addr.city,
      state:     addr.state,
      pincode:   addr.pincode,
      isDefault: Boolean(addr.isDefault),
    };
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await connectDB();
  const user = await User.findById(session.user!._id).select("addresses");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.addresses) user.addresses = [];
  const addr = user.addresses.find((a) => a._id.toString() === id);
  if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  if (body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  Object.assign(addr, body);
  await user.save();
  return NextResponse.json({ data: serializeAddresses(user.addresses), message: "Address updated" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const user = await User.findById(session.user!._id).select("addresses");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.addresses) user.addresses = [];
  const idx = user.addresses.findIndex((a) => a._id.toString() === id);
  if (idx === -1) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  user.addresses.splice(idx, 1);
  if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  return NextResponse.json({ data: serializeAddresses(user.addresses), message: "Address removed" });
}
