import { NextRequest } from "next/server";
import mongoose from "mongoose";
import type { PipelineStage } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import "@/models/category.model";
import { ok, badRequest, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 10;

function isAdmin(req: NextRequest) {
  return (
    req.headers.get("x-user-role") === "admin" &&
    req.headers.get("x-admin-verified") === "1"
  );
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "all";
    const q      = searchParams.get("q")?.trim() ?? "";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = Math.max(1, parseInt(searchParams.get("limit") ?? "30"));
    const skip   = (page - 1) * limit;

    const matchStage: Record<string, unknown> = { deletedAt: null };

    if (q) {
      matchStage.$or = [
        { name: { $regex: q, $options: "i" } },
        { sku:  { $regex: q, $options: "i" } },
      ];
    }

    if (status === "in_stock") {
      matchStage.stock = { $gt: LOW_STOCK_THRESHOLD };
    } else if (status === "low_stock") {
      matchStage.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
    } else if (status === "out_of_stock") {
      matchStage.stock = 0;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from:         "categories",
          localField:   "category",
          foreignField: "_id",
          as:           "categoryData",
        },
      },
      {
        $project: {
          _id:       1,
          name:      1,
          slug:      1,
          sku:       1,
          stock:     1,
          basePrice: 1,
          isActive:  1,
          images:    { $slice: ["$images", 1] },
          category: {
            $let: {
              vars: { cat: { $arrayElemAt: ["$categoryData", 0] } },
              in:   { name: "$$cat.name", slug: "$$cat.slug" },
            },
          },
        },
      },
      { $sort: { name: 1 as const } },
      {
        $facet: {
          data:  [{ $skip: skip }, { $limit: limit }],
          count: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline as PipelineStage[]);
    const products   = result.data as unknown[];
    const total      = (result.count[0]?.total as number) ?? 0;
    const totalPages = Math.ceil(total / limit);

    return ok({ products, total, page, totalPages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const body = (await req.json()) as { productId?: string; stock?: unknown };

    if (!body.productId || !mongoose.Types.ObjectId.isValid(body.productId)) {
      return badRequest("Valid productId is required.");
    }

    const stock = Number(body.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      return badRequest("Stock must be a non-negative number.");
    }

    const updated = await Product.findByIdAndUpdate(
      body.productId,
      { $set: { stock: Math.floor(stock) } },
      { new: true, select: "_id name slug sku stock basePrice isActive images category" }
    )
      .populate("category", "name slug")
      .lean();

    if (!updated) return badRequest("Product not found.");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
