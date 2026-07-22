import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { ok, created, forbidden, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";

    const query = search
      ? { deletedAt: null, name: { $regex: search, $options: "i" } }
      : { deletedAt: null };

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name slug basePrice compareAtPrice stock isActive isFeatured isBestSeller isNewArrival category images createdAt")
        .populate("category", "name slug")
        .lean(),
      Product.countDocuments(query),
    ]);

    return ok({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const body = await req.json();
    if (!body.name || !body.basePrice) {
      return badRequest("Name and base price are required.");
    }

    const product = await Product.create({
      ...body,
      slug: body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });

    return created({ product }, "Product created successfully.");
  } catch (err) {
    return handleApiError(err);
  }
}
