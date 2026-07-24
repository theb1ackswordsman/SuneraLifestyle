import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
import { ok, created, forbidden, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const collections = await Collection.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
    return ok(collections);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const body = await req.json();

    if (!body.name?.trim()) return badRequest("Collection name is required.");

    const baseSlug = slugify(body.name);
    let slug = baseSlug;
    let attempt = 1;
    while (await Collection.exists({ slug })) {
      slug = `${baseSlug}-${attempt++}`;
    }

    if (body.displayOrder === undefined) {
      const count = await Collection.countDocuments();
      body.displayOrder = count;
    }

    const collection = await Collection.create({ ...body, slug });
    return created({ collection }, "Collection created.");
  } catch (err) {
    return handleApiError(err);
  }
}
