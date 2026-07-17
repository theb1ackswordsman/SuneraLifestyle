import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { HeroBanner } from "@/models/hero-banner.model";
import { ok, forbidden, badRequest, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    if (!body.headline?.trim()) return badRequest("Headline is required");
    const banner = await HeroBanner.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!banner) return notFound("Banner not found");
    return ok({ banner }, "Banner updated");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const banner = await HeroBanner.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    if (!banner) return notFound("Banner not found");
    return ok({ banner });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();
    const banner = await HeroBanner.findByIdAndDelete(id);
    if (!banner) return notFound("Banner not found");
    return ok({ id }, "Banner deleted");
  } catch (err) {
    return handleApiError(err);
  }
}
