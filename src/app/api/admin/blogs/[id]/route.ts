import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Blog } from "@/models/blog.model";
import { ok, badRequest, forbidden, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return (
    req.headers.get("x-user-role") === "admin" &&
    req.headers.get("x-admin-verified") === "1"
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { id } = await params;
    const blog = await Blog.findOne({ _id: id, deletedAt: null }).lean();
    if (!blog) return notFound("Blog not found.");

    return ok({ blog });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { id } = await params;
    const existing = await Blog.findOne({ _id: id, deletedAt: null });
    if (!existing) return notFound("Blog not found.");

    const body = await req.json();
    const allowed = ["title", "excerpt", "content", "coverImage", "categories", "tags", "status", "seo"] as const;
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (!updates.title && "title" in body) return badRequest("Title cannot be empty.");

    if (typeof updates.content === "string" && updates.content.trim()) {
      const wordCount = updates.content.trim().split(/\s+/).length;
      updates.readingTime = Math.max(1, Math.round(wordCount / 200));
    }

    if (updates.status === "published" && existing.status !== "published" && !existing.publishedAt) {
      updates.publishedAt = new Date();
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    return ok({ blog });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { id } = await params;
    const blog = await Blog.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    if (!blog) return notFound("Blog not found.");

    return ok({ message: "Blog deleted" });
  } catch (err) {
    return handleApiError(err);
  }
}
