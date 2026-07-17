import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { ok, forbidden, notFound, handleApiError } from "@/lib/api/response";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id).populate("category", "name slug").lean();
    if (!product) return notFound("Product not found.");
    return ok({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const product = await Product.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!product) return notFound("Product not found.");
    return ok({ product }, "Product updated.");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    await Product.findByIdAndUpdate(id, { deletedAt: new Date() });
    return ok({}, "Product deleted.");
  } catch (err) {
    return handleApiError(err);
  }
}
