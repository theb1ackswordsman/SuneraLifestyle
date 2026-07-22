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

export async function GET() {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.user!._id).select("addresses");
  return NextResponse.json({ data: serializeAddresses(user?.addresses ?? []) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { label, name, phone, line1, line2, city, state, pincode, isDefault } = body;
  if (!name || !line1 || !city || !state || !pincode)
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  await connectDB();
  const user = await User.findById(session.user!._id).select("addresses");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.addresses) user.addresses = [];
  if (isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  const newAddr = {
    label: label ?? "Home",
    name,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    isDefault: !!isDefault || user.addresses.length === 0,
  };
  user.addresses.push(newAddr as never);
  await user.save();
  return NextResponse.json({ data: serializeAddresses(user.addresses), message: "Address added" }, { status: 201 });
}
