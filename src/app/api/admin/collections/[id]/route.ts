import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
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
    if (!body.name?.trim()) return badRequest("Collection name is required.");
    const collection = await Collection.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!collection) return notFound("Collection not found.");
    return ok({ collection }, "Collection updated.");
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
    const collection = await Collection.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!collection) return notFound("Collection not found.");
    return ok({ collection });
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
    const collection = await Collection.findByIdAndDelete(id);
    if (!collection) return notFound("Collection not found.");
    return ok({ id }, "Collection deleted.");
  } catch (err) {
    return handleApiError(err);
  }
}
