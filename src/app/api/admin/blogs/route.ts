import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Blog } from "@/models/blog.model";
import { ok, created, badRequest, forbidden, handleApiError } from "@/lib/api/response";

// Sentinel ObjectId used as a placeholder author for admin-created posts.
// Replace with the real admin user's _id if available in your auth session.
const ADMIN_AUTHOR_ID = new mongoose.Types.ObjectId("000000000000000000000001");

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return (
    req.headers.get("x-user-role") === "admin" &&
    req.headers.get("x-admin-verified") === "1"
  );
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const exists = await Blog.findOne({ slug: base, deletedAt: null }).lean();
  if (!exists) return base;

  let suffix = 2;
  while (true) {
    const candidate = `${base}-${suffix}`;
    const conflict = await Blog.findOne({ slug: candidate, deletedAt: null }).lean();
    if (!conflict) return candidate;
    suffix++;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "15"));
    const skip  = (page - 1) * limit;
    const q     = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") ?? "all";

    const filter: Record<string, unknown> = { deletedAt: null };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "_id title slug excerpt coverImage status viewCount readingTime categories tags createdAt publishedAt"
        )
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return ok({
      blogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const body = await req.json();
    const { title, excerpt, content, coverImage, categories, tags, status, seo } = body;

    if (!title?.trim())   return badRequest("Title is required.");
    if (!excerpt?.trim()) return badRequest("Excerpt is required.");
    if (!content?.trim()) return badRequest("Content is required.");

    const slug        = await generateUniqueSlug(title);
    const wordCount   = content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));
    const blogStatus  = status ?? "draft";
    const publishedAt = blogStatus === "published" ? new Date() : undefined;

    const blog = await Blog.create({
      title:       title.trim(),
      slug,
      excerpt:     excerpt.trim(),
      content:     content.trim(),
      coverImage:  coverImage ?? "",
      author:      ADMIN_AUTHOR_ID,
      categories:  Array.isArray(categories) ? categories : [],
      tags:        Array.isArray(tags) ? tags : [],
      status:      blogStatus,
      readingTime,
      publishedAt,
      seo:         seo ?? {},
    });

    return created({ blog });
  } catch (err) {
    return handleApiError(err);
  }
}
